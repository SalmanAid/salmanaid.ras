// app/api/cron/loan-reminder/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; 
import { WhatsAppService } from '@/services/whatsapp.service';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 1. Calculate the target date (14 days from now)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 14);
    
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // 2. Find expiring loans (Active loans with due date in 14 days)
    const expiringLoans = await prisma.loan.findMany({
      where: {
        status: "ACTIVE",
        dueDate: { gte: startOfDay, lte: endOfDay },
      },
      include: { 
        application: {
          include: { 
            borrower: true 
          } 
        } 
      },
    });

    // 3. Send Notifications using WhatsAppService (Custom Bot)
    const results = await Promise.allSettled(
      expiringLoans.map(loan => {
        const phoneNumber = loan.application.borrower.phone_number;
        const borrowerName = loan.application.borrower.name;
        
        if (phoneNumber) {
          const message = `Halo ${borrowerName}, pengajuan pinjaman Anda di SalmanAid akan jatuh tempo dalam 14 hari (pada tanggal ${new Date(loan.dueDate).toLocaleDateString('id-ID')}). Mohon pastikan saldo Anda cukup untuk pembayaran cicilan. Terima kasih.`;
          
          return WhatsAppService.sendMessage({
            to: phoneNumber,
            message: message,
          });
        }
      })
    );

    // Log failures if any with detail
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const error = result.reason;
        console.error(`Failed to send WhatsApp to ${expiringLoans[index]?.application.borrower.name}:`, {
          message: error.message,
          status: error.status,
          data: error.data // Ini akan memunculkan isi [Object] di Vercel Logs
        });
      }
    });

    return NextResponse.json({ 
      success: true, 
      processed: expiringLoans.length,
      failed: results.filter(r => r.status === 'rejected').length
    });
  } catch (error) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}