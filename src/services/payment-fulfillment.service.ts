import { prisma } from '@/lib/prisma';
import {
  LoanStatus,
  RepaymentStatus,
  TransactionCategory,
  type PaymentTransaction,
} from '@/generated/prisma';

export async function createBusinessRecordFromSettledPayment(paymentTransaction: PaymentTransaction) {
  if (paymentTransaction.status !== 'SETTLEMENT') {
    return;
  }

  if (paymentTransaction.category === TransactionCategory.DONATION) {
    const existingDonorFund = await prisma.donorFund.findUnique({
      where: { paymentTransactionId: paymentTransaction.id },
    });

    if (!existingDonorFund) {
      await prisma.donorFund.create({
        data: {
          donorId: paymentTransaction.referenceId,
          paymentTransactionId: paymentTransaction.id,
          amount: paymentTransaction.amount,
          remaining: paymentTransaction.amount,
        },
      });
    }

    return;
  }

  if (paymentTransaction.category === TransactionCategory.REPAYMENT) {
    await prisma.$transaction(async (tx) => {
      const loanByRef = await tx.loan.findFirst({
        where: { 
          OR: [
            { id: paymentTransaction.referenceId },
            { applicationId: paymentTransaction.referenceId }
          ]
        },
        select: {
          id: true,
          approvedAmount: true,
          status: true,
        },
      });

      if (!loanByRef) {
        return;
      }

      const existingRepayment = await tx.repayment.findUnique({
        where: { paymentTransactionId: paymentTransaction.id },
      });

      if (!existingRepayment) {
        await tx.repayment.create({
          data: {
            loanId: loanByRef.id,
            paymentTransactionId: paymentTransaction.id,
            amount: paymentTransaction.amount,
            paidAt: new Date(),
            status: RepaymentStatus.CONFIRMED,
          },
        });
      } else if (existingRepayment.status !== RepaymentStatus.CONFIRMED) {
        await tx.repayment.update({
          where: { id: existingRepayment.id },
          data: { status: RepaymentStatus.CONFIRMED },
        });
      }

      const repaymentTotals = await tx.repayment.aggregate({
        where: {
          loanId: loanByRef.id,
          status: RepaymentStatus.CONFIRMED,
        },
        _sum: {
          amount: true,
        },
      });

      const totalPaid = Number(repaymentTotals._sum.amount || 0);
      const approvedAmount = Number(loanByRef.approvedAmount);

      if (totalPaid >= approvedAmount && loanByRef.status !== "PAID") {
        await tx.loan.update({
          where: { id: loanByRef.id },
          data: { status: "PAID" },
        });

        // Trigger fund return logic for PAID
        const loanFundings = await tx.loanFunding.findMany({
          where: { 
            loanId: loanByRef.id, 
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
    });
  }
}
