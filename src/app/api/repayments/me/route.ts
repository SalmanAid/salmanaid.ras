import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const repayments = await prisma.repayment.findMany({
      where: {
        loan: {
          application: {
            borrowerId: currentUser.id,
          },
        },
      },
      orderBy: {
        paidAt: "desc",
      },
      select: {
        id: true,
        loanId: true,
        amount: true,
        paidAt: true,
        status: true,
        paymentTransactionId: true,
        loan: {
          select: {
            application: {
              select: {
                id: true,
                description: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      data: repayments.map((repayment) => ({
        id: repayment.id,
        loanId: repayment.loanId,
        applicationId: repayment.loan?.application?.id || null,
        loanName: repayment.loan?.application?.description || null,
        amount: Number(repayment.amount),
        paidAt: repayment.paidAt,
        status: repayment.status,
        paymentTransactionId: repayment.paymentTransactionId || null,
      })),
    });
  } catch (error) {
    console.error("Error in GET /api/repayments/me:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
