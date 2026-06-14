import { prisma } from "@/lib/prisma";
import { RepaymentStatus } from "@/generated/prisma";

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
          status: RepaymentStatus.CONFIRMED, // or PENDING based on your flow
        },
      });

      // 3. Check total paid amount
      const previouslyPaid = loan.repayments
        .filter(r => r.status === RepaymentStatus.CONFIRMED)
        .reduce((sum, r) => sum + Number(r.amount), 0);
      
      const totalPaid = previouslyPaid + Number(data.amount);
      const isFullyPaid = totalPaid >= Number(loan.approvedAmount);

      // 4. Update Loan Status & Process Funds if fully paid
      if (isFullyPaid && loan.status !== "PAID") {
        await tx.loan.update({
          where: { id: data.loanId },
          data: { status: "PAID" }
        });

        // TODO: Handle logic for forgiven loans where partial repayment might require proportional partial returns to the DonorFund.
        // Currently, forgiven loans trigger full return of all associated LoanFunding records identically to a PAID status.

        // Trigger fund return logic for PAID
        const loanFundings = await tx.loanFunding.findMany({
          where: { 
            loanId: data.loanId, 
            sourceType: 'DONOR',
          }
        });

        for (const funding of loanFundings) {
          if (funding.donorFundId && funding.status !== "RETURNED") {
            // Update funding status
            await tx.loanFunding.update({
              where: { id: funding.id },
              data: { status: "RETURNED" }
            });

            // Increment donor fund remaining
            await tx.donorFund.update({
              where: { id: funding.donorFundId },
              data: {
                remaining: { increment: funding.amount }
              }
            });
          }
        }
      }

      return repayment;
    });
  }
}