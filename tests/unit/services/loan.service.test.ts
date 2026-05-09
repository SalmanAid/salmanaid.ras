import { describe, it, expect, vi } from 'vitest';
import { LoanService } from '@/services/loan.service';
import { prisma } from '@/lib/prisma';
import { LoanApplicationStatus, Prisma } from '@/generated/prisma';

describe('LoanService', () => {
  describe('createLoanApplication', () => {
    it('should create a loan application', async () => {
      const mockApp = { id: 'app-1', status: 'PENDING' };
      (prisma.loanApplication.create as any).mockResolvedValue(mockApp);

      const result = await LoanService.createLoanApplication('user-1', {
        requestedAmount: 500000,
        description: 'Tuition fee',
        collateralUrl: '',
        collateralDescription: '',
      });

      expect(result.id).toBe('app-1');
      expect(prisma.loanApplication.create).toHaveBeenCalled();
    });
  });

  describe('approveLoanApplication', () => {
    it('should approve application and create a loan', async () => {
      const mockAppId = 'app-1';
      const mockTx = {
        loanApplication: {
          findUnique: vi.fn().mockResolvedValue({ id: mockAppId, borrowerId: 'b-1', status: 'PENDING' }),
          update: vi.fn().mockResolvedValue({ id: mockAppId, status: 'APPROVED' }),
        },
        applicationStatusHistory: {
          create: vi.fn(),
        },
        loan: {
          upsert: vi.fn().mockResolvedValue({ id: 'loan-1', approvedAmount: new Prisma.Decimal(500000) }),
        },
        notification: {
          create: vi.fn(),
        },
        user: {
          findUnique: vi.fn().mockResolvedValue({ email: 'test@test.com' }),
        }
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      const result = await LoanService.approveLoanApplication({
        applicationId: mockAppId,
        adminId: 'admin-1',
        approvedAmount: 500000,
      });

      expect(result.application.status).toBe('APPROVED');
      expect(mockTx.loan.upsert).toHaveBeenCalled();
    });
  });
});
