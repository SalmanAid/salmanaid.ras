import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { simulateTransactionSettlement } from '@/services/midtrans.service';
import { createBusinessRecordFromSettledPayment } from '@/services/payment-fulfillment.service';

/**
 * POST /api/payments/midtrans/simulate
 */
const SIM_DBG = '[SIMULATE-DEBUG]';
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (process.env.MIDTRANS_ENVIRONMENT === 'production') {
      return NextResponse.json(
        { error: 'Simulation is only available in sandbox mode' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { orderId } = body as { orderId?: string };

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const simulationResult = await simulateTransactionSettlement(orderId);
    console.log(`${SIM_DBG} simulateTransactionSettlement result for orderId=${orderId}:`, JSON.stringify(simulationResult).slice(0, 300));

    await prisma.paymentTransaction.updateMany({
      where: { externalId: orderId },
      data: {
        status: 'SETTLEMENT',
        response: simulationResult.rawResponse as Prisma.InputJsonValue,
      },
    });
    console.log(`${SIM_DBG} DB updated to SETTLEMENT for orderId=${orderId}`);

    const settledTransaction = await prisma.paymentTransaction.findFirst({
      where: { externalId: orderId },
    });
    console.log(`${SIM_DBG} Re-fetched settledTransaction: id=${settledTransaction?.id} status=${settledTransaction?.status} category=${settledTransaction?.category} referenceId=${settledTransaction?.referenceId}`);

    if (settledTransaction) {
      console.log(`${SIM_DBG} Calling createBusinessRecordFromSettledPayment...`);
      try {
        await createBusinessRecordFromSettledPayment(settledTransaction);
        console.log(`${SIM_DBG} createBusinessRecordFromSettledPayment returned successfully.`);
      } catch (fundReturnError) {
        console.error(`${SIM_DBG} ERROR inside createBusinessRecordFromSettledPayment:`, fundReturnError);
        if (fundReturnError instanceof Error) {
          console.error(`${SIM_DBG} Error message: ${fundReturnError.message}`);
          console.error(`${SIM_DBG} Stack trace:`, fundReturnError.stack);
        }
      }
    } else {
      console.log(`${SIM_DBG} WARNING: settledTransaction was null after update. createBusinessRecordFromSettledPayment NOT called.`);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Simulation sent to Midtrans sandbox',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`${SIM_DBG} UNCAUGHT ERROR in simulate route:`, error);
    if (error instanceof Error) {
      console.error(`${SIM_DBG} Error message: ${error.message}`);
      console.error(`${SIM_DBG} Stack trace:`, error.stack);
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to simulate transaction',
      },
      { status: 500 }
    );
  }
}
