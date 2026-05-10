import { prisma } from "@/lib/prisma";
import { RepaymentStatus } from "@/generated/prisma";

export class RepaymentService {
  static async recordRepayment(data: { loanId: string; amount: number; paidAt?: Date }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Check if loan exists
      const loan = await tx.loan.findUnique({
        where: { id: data.loanId },
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

      return repayment;
    });
  }
}