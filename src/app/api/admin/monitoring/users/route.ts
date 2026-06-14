import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const roles = (session.user as any).roles || [];
    const isAdmin = roles.includes("ADMIN");

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    // Fetch all users who have the BORROWER role
    const users = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: "BORROWER",
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        loanApplications: {
          include: {
            loan: {
              include: {
                repayments: {
                  where: {
                    status: "CONFIRMED", // Or whatever successful status is used
                  },
                  select: {
                    amount: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const aggregatedUsers = users.map((user) => {
      // Filter applications that actually have a loan created (approved)
      const loans = user.loanApplications
        .map((app) => app.loan)
        .filter((loan) => loan !== null);

      let totalBorrowed = 0;
      let totalRepaid = 0;
      let activeDebt = 0;

      loans.forEach((loan) => {
        const approvedAmount = Number(loan!.approvedAmount || 0);
        
        // Compute total paid from confirmed repayments
        const totalPaid = loan!.repayments?.reduce(
          (sum: number, repayment: any) => sum + Number(repayment.amount),
          0
        ) || 0;

        totalBorrowed += approvedAmount;
        totalRepaid += totalPaid;

        if (loan!.status === "ACTIVE" || loan!.status === "DEFAULTED") {
          activeDebt += Math.max(approvedAmount - totalPaid, 0);
        }

        // Add totalPaid to the loan object for the frontend
        (loan as any).totalPaid = totalPaid;
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        loanCount: loans.length,
        totalBorrowed,
        totalRepaid,
        activeDebt,
        loans: loans, // Include raw loans for drill-down views if necessary
      };
    });

    return NextResponse.json(
      { success: true, data: aggregatedUsers },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching aggregated user monitoring data:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data monitoring pengguna" },
      { status: 500 }
    );
  }
}
