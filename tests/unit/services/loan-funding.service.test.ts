import { describe, it, expect, vi } from 'vitest';
import { LoanFundingService } from '@/services/loan-funding.service';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';

describe('LoanFundingService', () => {
  describe('allocateDonorFund', () => {
    it('should allocate fund successfully within a transaction', async () => {
      const mockLoan = {
        id: 'loan-1',
        approvedAmount: new Prisma.Decimal(1000000),
        application: { borrowerId: 'user-borrower' },
        fundings: [{ amount: new Prisma.Decimal(200000) }],
      };

      const mockDonorFund = {
        id: 'fund-1',
        donorId: 'user-donor',
        remaining: new Prisma.Decimal(500000),
      };

      const mockTx = {
        loan: {
          findUnique: vi.fn().mockResolvedValue(mockLoan),
        },
        donorFund: {
          findUnique: vi.fn().mockResolvedValue(mockDonorFund),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        loanFunding: {
          create: vi.fn().mockResolvedValue({
            id: 'funding-1',
            loanId: 'loan-1',
            donorFundId: 'fund-1',
            sourceType: 'DONOR',
            amount: new Prisma.Decimal(100000),
          }),
        },
        notification: {
          create: vi.fn(),
          createMany: vi.fn(),
        },
        user: {
          findUnique: vi.fn().mockResolvedValue({ email: 'test@test.com' }),
        }
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      const result = await LoanFundingService.allocateDonorFund({
        loanId: 'loan-1',
        donorFundId: 'fund-1',
        amount: 100000,
      });

      expect(result.amount).toBe(100000);
      expect(mockTx.donorFund.updateMany).toHaveBeenCalled();
      expect(mockTx.loanFunding.create).toHaveBeenCalled();
    });

    it('should throw error if donor fund is insufficient', async () => {
      const mockLoan = {
        id: 'loan-1',
        approvedAmount: new Prisma.Decimal(1000000),
        application: { borrowerId: 'user-borrower' },
        fundings: [],
      };

      const mockDonorFund = {
        id: 'fund-1',
        donorId: 'user-donor',
        remaining: new Prisma.Decimal(50),
      };

      const mockTx = {
        loan: { findUnique: vi.fn().mockResolvedValue(mockLoan) },
        donorFund: { findUnique: vi.fn().mockResolvedValue(mockDonorFund) },
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await expect(LoanFundingService.allocateDonorFund({
        loanId: 'loan-1',
        donorFundId: 'fund-1',
        amount: 100000,
      })).rejects.toThrow('INSUFFICIENT_DONOR_FUND');
    });
  });
});
