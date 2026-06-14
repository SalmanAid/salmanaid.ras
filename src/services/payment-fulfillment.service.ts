import { prisma } from '@/lib/prisma';
import {
  LoanStatus,
  RepaymentStatus,
  TransactionCategory,
  FundingSourceType,
  FundingStatus,
  type PaymentTransaction,
} from '@/generated/prisma';

const DBG = '[DONOR-RETURN-DEBUG]';

export async function createBusinessRecordFromSettledPayment(paymentTransaction: PaymentTransaction) {
  console.log(`${DBG} Webhook received. txId=${paymentTransaction.id} status=${paymentTransaction.status} category=${paymentTransaction.category} referenceId=${paymentTransaction.referenceId}`);

  if (paymentTransaction.status !== 'SETTLEMENT') {
    console.log(`${DBG} Skipped: status is not SETTLEMENT (got ${paymentTransaction.status})`);
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
    console.log(`${DBG} Category is REPAYMENT. Starting transaction...`);

    try {
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

        console.log(`${DBG} loanByRef result:`, JSON.stringify(loanByRef));

        if (!loanByRef) {
          console.log(`${DBG} EARLY EXIT: No loan found for referenceId=${paymentTransaction.referenceId}`);
          return;
        }

        const existingRepayment = await tx.repayment.findUnique({
          where: { paymentTransactionId: paymentTransaction.id },
        });

        console.log(`${DBG} existingRepayment:`, JSON.stringify(existingRepayment));

        if (!existingRepayment) {
          console.log(`${DBG} Creating new repayment record...`);
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
          console.log(`${DBG} Updating existing repayment to CONFIRMED...`);
          await tx.repayment.update({
            where: { id: existingRepayment.id },
            data: { status: RepaymentStatus.CONFIRMED },
          });
        } else {
          console.log(`${DBG} Repayment already exists and is CONFIRMED. Idempotent skip.`);
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

        console.log(`${DBG} Payment check: totalPaid=${totalPaid} approvedAmount=${approvedAmount} currentLoanStatus=${loanByRef.status}`);

        if (totalPaid >= approvedAmount && loanByRef.status !== LoanStatus.PAID) {
          console.log(`${DBG} Loan fully paid. Updating loan status to PAID and triggering fund return...`);

          await tx.loan.update({
            where: { id: loanByRef.id },
            data: { status: LoanStatus.PAID },
          });

          // Query using the typed enum constant to avoid any string coercion ambiguity
          const loanFundings = await tx.loanFunding.findMany({
            where: { 
              loanId: loanByRef.id, 
              sourceType: FundingSourceType.DONOR,
            }
          });

          console.log(`${DBG} loanFundings found for DONOR sourceType: count=${loanFundings.length}`, JSON.stringify(loanFundings.map(f => ({ id: f.id, status: f.status, donorFundId: f.donorFundId, amount: f.amount?.toString() }))));

          if (loanFundings.length === 0) {
            console.log(`${DBG} WARNING: No DONOR LoanFunding records found for loanId=${loanByRef.id}. Fund return skipped.`);
          }

          for (const funding of loanFundings) {
            console.log(`${DBG} Processing funding id=${funding.id} status=${funding.status} donorFundId=${funding.donorFundId} amount=${funding.amount?.toString()}`);

            if (funding.donorFundId && funding.status !== FundingStatus.RETURNED) {
              console.log(`${DBG} Updating LoanFunding ${funding.id} to RETURNED and incrementing DonorFund ${funding.donorFundId} by ${funding.amount?.toString()}...`);

              await tx.loanFunding.update({
                where: { id: funding.id },
                data: { status: FundingStatus.RETURNED }
              });

              await tx.donorFund.update({
                where: { id: funding.donorFundId },
                data: {
                  remaining: { increment: funding.amount }
                }
              });

              console.log(`${DBG} Done: DonorFund ${funding.donorFundId} incremented.`);
            } else {
              console.log(`${DBG} Skipped funding id=${funding.id}: donorFundId=${funding.donorFundId} status=${funding.status}`);
            }
          }

          console.log(`${DBG} Fund return loop complete.`);
        } else if (loanByRef.status === LoanStatus.PAID) {
          console.log(`${DBG} SKIPPED fund return: loan is already PAID (idempotent re-delivery). totalPaid=${totalPaid} approvedAmount=${approvedAmount}`);
        } else {
          console.log(`${DBG} SKIPPED fund return: loan not yet fully paid. totalPaid=${totalPaid} approvedAmount=${approvedAmount}`);
        }
      });

      console.log(`${DBG} Transaction completed successfully.`);
    } catch (txError) {
      console.error(`${DBG} ERROR: Prisma transaction threw an exception:`);
      console.error(txError);
      if (txError instanceof Error) {
        console.error(`${DBG} Error message: ${txError.message}`);
        console.error(`${DBG} Stack trace:`, txError.stack);
      }
      // Rethrow so callers can also catch and log it
      throw txError;
    }
  }
}
