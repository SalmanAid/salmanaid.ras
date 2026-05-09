import { describe, it, expect, vi } from 'vitest';
import { DonationService } from '@/services/donations.service';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';

describe('DonationService', () => {
  describe('createDonation', () => {
    it('should create donor fund and payment transaction', async () => {
      const mockTx = {
        donorFund: {
          create: vi.fn().mockResolvedValue({ id: 'fund-1', amount: 100000 }),
        },
        paymentTransaction: {
          create: vi.fn().mockResolvedValue({ id: 'pay-1', externalId: 'DON-123' }),
        },
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      const result = await DonationService.createDonation('user-1', {
        amount: 100000,
        paymentType: 'QRIS',
      });

      expect(mockTx.donorFund.create).toHaveBeenCalled();
      expect(mockTx.paymentTransaction.create).toHaveBeenCalled();
      expect(result.donorFund.id).toBe('fund-1');
    });
  });

  describe('getDonations', () => {
    it('should return formatted donor funds', async () => {
      (prisma.donorFund.findMany as any).mockResolvedValue([
        {
          id: '1',
          amount: new Prisma.Decimal(5000),
          remaining: new Prisma.Decimal(2000),
          donor: { name: 'Donor A', image: null },
          paymentTransaction: { paymentType: 'BCA' },
        },
      ]);

      const result = await DonationService.getDonations();

      expect(result.donations).toHaveLength(1);
      expect(result.donations[0].available).toBe(2000);
      expect(result.donations[0].name).toBe('Donor A');
    });
  });
});
