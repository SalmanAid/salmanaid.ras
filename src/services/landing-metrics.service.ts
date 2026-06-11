import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export type LandingMetrics = {
  totalDonations: number;
  totalDisbursed: number;
  studentsHelped: number;
  activeLoans: number;
};

const getCachedMetrics = unstable_cache(
  async (): Promise<LandingMetrics> => {
    const [donations, disbursed, students, activeLoans] = await prisma.$transaction([
      prisma.donorFund.aggregate({ _sum: { amount: true } }),
      prisma.loan.aggregate({ _sum: { approvedAmount: true } }),
      prisma.loanApplication.findMany({
        where: { status: "APPROVED" },
        distinct: ["borrowerId"],
        select: { borrowerId: true },
      }),
      prisma.loan.count({ where: { status: "ACTIVE" } }),
    ]);

    return {
      totalDonations: Number(donations._sum.amount || 0),
      totalDisbursed: Number(disbursed._sum.approvedAmount || 0),
      studentsHelped: students.length,
      activeLoans,
    };
  },
  ["landing-metrics"],
  { revalidate: 300, tags: ["landing:metrics"] }
);

export async function getLandingMetrics(): Promise<LandingMetrics> {
  try {
    return await getCachedMetrics();
  } catch (error) {
    console.error(JSON.stringify({
      event: "landing_metrics_fallback",
      message: error instanceof Error ? error.message : "unknown",
    }));
    return { totalDonations: 0, totalDisbursed: 0, studentsHelped: 0, activeLoans: 0 };
  }
}
