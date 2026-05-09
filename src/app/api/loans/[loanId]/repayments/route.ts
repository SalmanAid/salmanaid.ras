import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ loanId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { loanId } = await params;

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      select: {
        id: true,
        approvedAmount: true,
        status: true,
        application: {
          select: { borrowerId: true },
        },
      },
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    if (loan.application.borrowerId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const repayments = await prisma.repayment.findMany({
      where: {
        loanId,
        status: "CONFIRMED",
      },
      orderBy: {
        paidAt: "asc",
      },
      select: {
        id: true,
        amount: true,
        paidAt: true,
        status: true,
      },
    });

    const totalPaid = repayments.reduce((sum, repayment) => sum + Number(repayment.amount), 0);

    return NextResponse.json({
      data: {
        loan: {
          id: loan.id,
          approvedAmount: Number(loan.approvedAmount),
          status: loan.status,
        },
        totalPaid,
        repayments: repayments.map((repayment) => ({
          ...repayment,
          amount: Number(repayment.amount),
        })),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/loans/[loanId]/repayments:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
