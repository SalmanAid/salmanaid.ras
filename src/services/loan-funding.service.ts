import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import type { CreateLoanFundingInput } from "@/schemas/loan-funding.schema";
import { NotificationService } from "@/services/notification.service";

function toDecimal(amount: number) {
  return new Prisma.Decimal(amount);
}

function decimalToNumber(value: Prisma.Decimal) {
  return value.toNumber();
}

export const LoanFundingService = {
  async allocateDonorFund(input: CreateLoanFundingInput) {
    const totalAmountRequired = toDecimal(input.amount);

    return prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { id: input.loanId },
        include: {
          application: {
            select: {
              borrowerId: true,
            },
          },
          fundings: {
            select: {
              amount: true,
            },
          },
        },
      });

      if (!loan) {
        throw new Error("LOAN_NOT_FOUND");
      }

      // Instead of finding one specific donorFundId, find all funds for the donorId
      const donorFunds = await tx.donorFund.findMany({
        where: { 
          donorId: input.donorId,
          remaining: { gt: 0 }
        },
        orderBy: {
          createdAt: "asc", // FIFO logic: oldest funds first
        },
        select: {
          id: true,
          donorId: true,
          remaining: true,
        },
      });

      if (donorFunds.length === 0) {
        throw new Error("DONOR_FUND_NOT_FOUND");
      }

      const totalAvailable = donorFunds.reduce((sum, f) => sum.plus(f.remaining), new Prisma.Decimal(0));
      if (totalAvailable.lessThan(totalAmountRequired)) {
        throw new Error("INSUFFICIENT_DONOR_FUND");
      }

      const allocatedAmount = loan.fundings.reduce(
        (total, funding) => total.plus(funding.amount),
        new Prisma.Decimal(0)
      );
      const loanRemaining = loan.approvedAmount.minus(allocatedAmount);

      if (loanRemaining.lessThan(totalAmountRequired)) {
        throw new Error("LOAN_OVER_ALLOCATION");
      }

      // Start FIFO Allocation
      let amountLeftToAllocate = totalAmountRequired;
      const createdFundings = [];

      for (const fund of donorFunds) {
        if (amountLeftToAllocate.lte(0)) break;

        const amountFromThisFund = Prisma.Decimal.min(fund.remaining, amountLeftToAllocate);

        // Update the specific donor fund
        const donorFundUpdate = await tx.donorFund.updateMany({
          where: {
            id: fund.id,
            remaining: { gte: amountFromThisFund },
          },
          data: {
            remaining: { decrement: amountFromThisFund },
          },
        });

        if (donorFundUpdate.count !== 1) {
          throw new Error("INSUFFICIENT_DONOR_FUND"); // Concurrency safety
        }

        // Create the specific funding record for this portion
        const loanFunding = await tx.loanFunding.create({
          data: {
            loanId: input.loanId,
            donorFundId: fund.id,
            sourceType: "DONOR",
            amount: amountFromThisFund,
          },
        });

        createdFundings.push(loanFunding);
        amountLeftToAllocate = amountLeftToAllocate.minus(amountFromThisFund);
      }

      await NotificationService.createLoanFundingNotifications(
        {
          borrowerId: loan.application.borrowerId,
          donorId: input.donorId,
          loanId: input.loanId,
          amount: input.amount,
        },
        tx
      );

      // We return the last funding record format to keep API contract somewhat similar,
      // but returning the total allocation data
      return {
        id: createdFundings[0]?.id || "", // Note: might be multiple, returning first id as a reference
        loanId: input.loanId,
        donorId: input.donorId,
        sourceType: "DONOR",
        amount: decimalToNumber(totalAmountRequired),
        remainingDonorFund: decimalToNumber(totalAvailable.minus(totalAmountRequired)),
        remainingLoanAmount: decimalToNumber(loanRemaining.minus(totalAmountRequired)),
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  },
};
