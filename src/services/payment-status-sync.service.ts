import type { PaymentTransaction } from '@/generated/prisma';
import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';
import { createBusinessRecordFromSettledPayment } from '@/services/payment-fulfillment.service';
import { getTransactionStatus, mapMidtransStatus } from '@/services/midtrans.service';

const DBG = '[SYNC-DEBUG]';

export async function syncPaymentTransactionFromMidtrans(orderId: string) {
  console.log(`${DBG} syncPaymentTransactionFromMidtrans called for orderId=${orderId}`);

  const paymentTransaction = await prisma.paymentTransaction.findFirst({
    where: { externalId: orderId },
  });

  if (!paymentTransaction) {
    console.log(`${DBG} No paymentTransaction found in DB for orderId=${orderId}. Returning null.`);
    return {
      paymentTransaction: null,
      detail: null,
    };
  }

  console.log(`${DBG} Found paymentTransaction id=${paymentTransaction.id} currentStatus=${paymentTransaction.status} category=${paymentTransaction.category} referenceId=${paymentTransaction.referenceId}`);

  let statusResult;
  try {
    statusResult = await getTransactionStatus(orderId);
    console.log(`${DBG} Midtrans raw status response: status=${statusResult.status}`, JSON.stringify(statusResult.rawResponse).slice(0, 300));
  } catch (err) {
    console.error(`${DBG} ERROR calling getTransactionStatus for orderId=${orderId}:`, err);
    throw err;
  }

  const mappedStatus = mapMidtransStatus(statusResult.status);
  const finalStatus =
    paymentTransaction.status === 'SETTLEMENT' ? paymentTransaction.status : mappedStatus;

  console.log(`${DBG} Status mapping: midtransRaw=${statusResult.status} -> mapped=${mappedStatus} -> final=${finalStatus} (currentInDB=${paymentTransaction.status})`);

  const updatedTransaction = await prisma.paymentTransaction.update({
    where: { id: paymentTransaction.id },
    data: {
      status: finalStatus,
      response: statusResult.rawResponse as Prisma.InputJsonValue,
    },
  });

  console.log(`${DBG} Updated paymentTransaction in DB to status=${finalStatus}`);

  if (finalStatus === 'SETTLEMENT') {
    console.log(`${DBG} Status is SETTLEMENT — calling createBusinessRecordFromSettledPayment...`);
    await createBusinessRecordFromSettledPayment({
      ...paymentTransaction,
      status: finalStatus,
    } as PaymentTransaction);
    console.log(`${DBG} createBusinessRecordFromSettledPayment returned successfully.`);
  } else {
    console.log(`${DBG} Status is NOT SETTLEMENT (${finalStatus}) — skipping fund return.`);
  }

  return {
    paymentTransaction: updatedTransaction,
    detail: statusResult,
  };
}
