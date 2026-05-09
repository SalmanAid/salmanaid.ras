import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !(session.user as any)?.roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const donations = await prisma.donorFund.findMany({
      select: {
        createdAt: true,
        amount: true,
      },
      orderBy: {
        createdAt: 'asc',
      }
    });

    const loans = await prisma.loan.findMany({
      select: {
        approvedAt: true,
        approvedAmount: true,
      },
      orderBy: {
        approvedAt: 'asc',
      }
    });

    const aggregated: Record<string, { month: string; totalDonation: number; totalLoan: number }> = {};

    donations.forEach(d => {
      const month = d.createdAt.toISOString().slice(0, 7);
      if (!aggregated[month]) {
        aggregated[month] = { month, totalDonation: 0, totalLoan: 0 };
      }
      aggregated[month].totalDonation += Number(d.amount);
    });

    loans.forEach(l => {
      const month = l.approvedAt.toISOString().slice(0, 7);
      if (!aggregated[month]) {
        aggregated[month] = { month, totalDonation: 0, totalLoan: 0 };
      }
      aggregated[month].totalLoan += Number(l.approvedAmount);
    });

    const data = Object.values(aggregated).sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}