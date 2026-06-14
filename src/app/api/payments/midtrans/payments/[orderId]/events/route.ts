import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { buildPaymentTransactionDetail } from '@/services/payment-transaction-presenter.service';
import { validatePaymentTransactionAccess } from '@/services/midtrans-payment-request.service';
import { syncPaymentTransactionFromMidtrans } from '@/services/payment-status-sync.service';

export const dynamic = 'force-dynamic';

const developerFallbackPollingEnabled =
  process.env.MIDTRANS_DEV_FALLBACK_POLLING === 'true';

const SSE_DBG = '[SSE-DEBUG]';

function toSseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth();

  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { orderId } = await params;

  if (!orderId) {
    return new Response(JSON.stringify({ error: 'orderId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!currentUser) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const paymentTransaction = await prisma.paymentTransaction.findFirst({
    where: { externalId: orderId },
  });

  if (!paymentTransaction) {
    return new Response(JSON.stringify({ error: 'Payment transaction not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const accessCheck = await validatePaymentTransactionAccess({
    category: paymentTransaction.category,
    referenceId: paymentTransaction.referenceId,
    currentUserId: currentUser.id,
    findLoanBorrowerId: async (loanId) => {
      const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        select: {
          application: {
            select: {
              borrowerId: true,
            },
          },
        },
      });

      return loan?.application.borrowerId || null;
    },
  });

  if (!accessCheck.ok) {
    return new Response(JSON.stringify({ error: accessCheck.error }), {
      status: accessCheck.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let lastPayload = '';
      let pollCount = 0;

      const closeStream = () => {
        if (closed) return;
        closed = true;
        if (intervalId) clearInterval(intervalId);
        controller.close();
      };

      const pushUpdate = async () => {
        try {
          const latestTransaction = await prisma.paymentTransaction.findFirst({
            where: { externalId: orderId },
          });

          if (!latestTransaction) {
            console.log(`${SSE_DBG} [${orderId}] paymentTransaction disappeared from DB. Closing stream.`);
            controller.enqueue(
              encoder.encode(
                toSseEvent('payment-error', { error: 'Payment transaction not found' })
              )
            );
            closeStream();
            return;
          }

          pollCount += 1;
          console.log(`${SSE_DBG} [${orderId}] poll #${pollCount} — dbStatus=${latestTransaction.status} fallbackEnabled=${developerFallbackPollingEnabled} willSync=${developerFallbackPollingEnabled && latestTransaction.status === 'PENDING' && pollCount % 5 === 0}`);

          if (
            developerFallbackPollingEnabled &&
            latestTransaction.status === 'PENDING' &&
            pollCount % 5 === 0
          ) {
            console.log(`${SSE_DBG} [${orderId}] Triggering Midtrans sync at poll #${pollCount}...`);
            const synced = await syncPaymentTransactionFromMidtrans(orderId);
            if (!synced.paymentTransaction) {
              console.log(`${SSE_DBG} [${orderId}] syncPaymentTransactionFromMidtrans returned null. Closing stream.`);
              controller.enqueue(
                encoder.encode(
                  toSseEvent('payment-error', { error: 'Payment transaction not found' })
                )
              );
              closeStream();
              return;
            }
            console.log(`${SSE_DBG} [${orderId}] Sync complete. New status in DB=${synced.paymentTransaction.status}`);
          }

          const refreshedTransaction =
            developerFallbackPollingEnabled &&
            latestTransaction.status === 'PENDING' &&
            pollCount % 5 === 0
              ? await prisma.paymentTransaction.findFirst({
                  where: { externalId: orderId },
                })
              : latestTransaction;

          if (!refreshedTransaction) {
            controller.enqueue(
              encoder.encode(
                toSseEvent('payment-error', { error: 'Payment transaction not found' })
              )
            );
            closeStream();
            return;
          }

          const payload = {
            success: true,
            data: buildPaymentTransactionDetail(refreshedTransaction),
          };

          const serialized = JSON.stringify(payload);
          if (serialized !== lastPayload) {
            lastPayload = serialized;
            controller.enqueue(encoder.encode(toSseEvent('payment', payload)));
          }

          if (['SETTLEMENT', 'EXPIRE', 'FAILURE'].includes(refreshedTransaction.status)) {
            console.log(`${SSE_DBG} [${orderId}] Terminal status reached: ${refreshedTransaction.status}. Closing stream.`);
            closeStream();
          }
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              toSseEvent('payment-error', {
                error:
                  error instanceof Error ? error.message : 'Failed to stream payment updates',
              })
            )
          );
          closeStream();
        }
      };

      console.log(`${SSE_DBG} [${orderId}] SSE stream opened. fallbackPollingEnabled=${developerFallbackPollingEnabled}`);
      controller.enqueue(
        encoder.encode(
          toSseEvent('connected', { success: true, orderId })
        )
      );

      void pushUpdate();
      intervalId = setInterval(() => {
        void pushUpdate();
      }, 2000);
    },
    cancel() {
      console.log(`${SSE_DBG} [${orderId}] SSE stream cancelled by client (navigated away or connection dropped).`);
      if (intervalId) clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
