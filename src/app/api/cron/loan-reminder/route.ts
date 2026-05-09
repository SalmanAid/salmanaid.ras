// app/api/cron/loan-reminder/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; 
import { sendWhatsAppExpiryReminder } from '../../../../lib/whatsapp'; // The function from my previous answer

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Calculate the target date (14 days from now)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 14);
    
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // 3. Find expiring loans
    const expiringLoans = await prisma.loanApplication.findMany({
      where: {
        status: "APPROVED",
        expiryDate: { gte: startOfDay, lte: endOfDay },
      },
      include: { borrower: true },
    });

    // 4. Send Notifications
    const results = await Promise.allSettled(
      expiringLoans.map(loan => {
        if (loan.borrower.phone_number) {
          return sendWhatsAppExpiryReminder(
            loan.borrower.phone_number,
            loan.borrower.name,
            14
          );
        }
      })
    );

    return NextResponse.json({ 
      success: true, 
      processed: expiringLoans.length 
    });
  } catch (error) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}