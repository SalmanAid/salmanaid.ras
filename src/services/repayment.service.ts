import { prisma } from "@/lib/prisma";
import { RepaymentStatus, LoanStatus } from "@/generated/prisma";

export class RepaymentService {
  static async recordRepayment(data: { loanId: string; amount: number; paidAt?: Date }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Check if loan exists
      const loan = await tx.loan.findUnique({
        where: { id: data.loanId },
        include: { repayments: true },
      });

      if (!loan) throw new Error("LOAN_NOT_FOUND");

      // 2. Create the repayment record
      const repayment = await tx.repayment.create({
        data: {
          loanId: data.loanId,
          amount: data.amount,
          paidAt: data.paidAt || new Date(),
          status: RepaymentStatus.CONFIRMED,
        },
      });

      // 3. Check total paid amount
      const previouslyPaid = loan.repayments
        .filter(r => r.status === RepaymentStatus.CONFIRMED)
        .reduce((sum, r) => sum + Number(r.amount), 0);
      
      const totalPaid = previouslyPaid + Number(data.amount);
      const isFullyPaid = totalPaid >= Number(loan.approvedAmount);

      // 4. Update Loan Status & Process Funds
      if (isFullyPaid && loan.status !== LoanStatus.PAID) {
        await tx.loan.update({
          where: { id: data.loanId },
          data: {
            status: LoanStatus.PAID,
            forgivenAmount: Number(loan.forgivenAmount) + Number(data.amount),
            forgivenAt: new Date(),
          }
        });

        // Trigger fund return logic for PAID
        const loanFundings = await tx.loanFunding.findMany({
          where: { 
            loanId: data.loanId, 
            sourceType: 'DONOR',
          }
        });

        for (const funding of loanFundings) {
          if (funding.donorFundId && funding.status !== "RETURNED") {
            await tx.loanFunding.update({
              where: { id: funding.id },
              data: { status: "RETURNED" }
            });

            await tx.donorFund.update({
              where: { id: funding.donorFundId },
              data: {
                remaining: { increment: funding.amount }
              }
            });
          }
        }
      } else if (!isFullyPaid && loan.status !== LoanStatus.PAID) {
        // Any non-zero admin reduction sets the loan to FORGIVEN
        const newForgivenAmount = Number(loan.forgivenAmount || 0) + Number(data.amount);
        await tx.loan.update({
          where: { id: data.loanId },
          data: {
            status: LoanStatus.FORGIVEN,
            forgivenAmount: newForgivenAmount,
            forgivenAt: new Date(),
          }
        });
      }

      return repayment;
    });
  }
}