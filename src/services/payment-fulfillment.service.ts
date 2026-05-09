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
      const existingRepayment = await tx.repayment.findUnique({
        where: { paymentTransactionId: paymentTransaction.id },
      });

      if (!existingRepayment) {
        await tx.repayment.create({
          data: {
            loanId: paymentTransaction.referenceId,
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

      const [loan, repaymentTotals] = await Promise.all([
        tx.loan.findUnique({
          where: { id: paymentTransaction.referenceId },
          select: {
            approvedAmount: true,
            status: true,
          },
        }),
        tx.repayment.aggregate({
          where: {
            loanId: paymentTransaction.referenceId,
            status: RepaymentStatus.CONFIRMED,
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      if (!loan) {
        return;
      }

      const totalPaid = Number(repaymentTotals._sum.amount || 0);
      const approvedAmount = Number(loan.approvedAmount);

      if (totalPaid >= approvedAmount && loan.status !== LoanStatus.PAID) {
        await tx.loan.update({
          where: { id: paymentTransaction.referenceId },
          data: { status: LoanStatus.PAID },
        });
      }
    });
  }
}
