import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { mapMidtransStatus, verifyMidtransSignature } from '@/services/midtrans.service';
import { createBusinessRecordFromSettledPayment } from '@/services/payment-fulfillment.service';

/**
 * POST /api/payments/midtrans/notification
 */
export async function POST(request: NextRequest) {
  console.log('[NOTIFICATION-DEBUG] POST /api/payments/midtrans/notification received');
  try {
    const payload = await request.json();
    console.log('[NOTIFICATION-DEBUG] Payload received:', JSON.stringify(payload).slice(0, 500));

    const signatureValid = verifyMidtransSignature(payload);
    if (!signatureValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const orderId = String(payload.order_id || '');
    const transactionStatus = String(payload.transaction_status || 'pending');
    const mappedStatus = mapMidtransStatus(transactionStatus);

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
    }

    const paymentTransaction = await prisma.paymentTransaction.findFirst({
      where: { externalId: orderId },
    });

    if (!paymentTransaction) {
      return NextResponse.json(
        { success: true, message: 'Notification received, transaction not found locally' },
        { status: 200 }
      );
    }

    const finalStatus =
      paymentTransaction.status === 'SETTLEMENT' ? paymentTransaction.status : mappedStatus;

    await prisma.paymentTransaction.update({
      where: { id: paymentTransaction.id },
      data: {
        status: finalStatus,
        response: payload as Prisma.InputJsonValue,
      },
    });

    if (finalStatus === 'SETTLEMENT') {
      try {
        await createBusinessRecordFromSettledPayment({
          ...paymentTransaction,
          status: finalStatus,
        });
      } catch (fundReturnError) {
        console.error('[NOTIFICATION-DEBUG] ERROR inside createBusinessRecordFromSettledPayment:', fundReturnError);
        if (fundReturnError instanceof Error) {
          console.error('[NOTIFICATION-DEBUG] Error message:', fundReturnError.message);
          console.error('[NOTIFICATION-DEBUG] Stack trace:', fundReturnError.stack);
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        orderId,
        status: finalStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[NOTIFICATION-DEBUG] UNCAUGHT ERROR in notification route:', error);
    if (error instanceof Error) {
      console.error('[NOTIFICATION-DEBUG] Error message:', error.message);
      console.error('[NOTIFICATION-DEBUG] Stack trace:', error.stack);
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process webhook',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'Midtrans notification endpoint is active',
      method: 'POST',
    },
    { status: 200 }
  );
}
