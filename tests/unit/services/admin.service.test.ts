import { describe, it, expect, vi } from 'vitest';
import { AdminService } from '@/services/admin.service';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';

describe('AdminService', () => {
  describe('getDashboardSummary', () => {
    it('should return aggregated statistics and logs', async () => {
      // Mock counts
      (prisma.loanApplication.count as any)
        .mockResolvedValueOnce(10) // totalLoans
        .mockResolvedValueOnce(3);  // pendingLoans

      // Mock aggregates
      (prisma.donorFund.aggregate as any).mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(5000000) },
        _count: 5,
      });

      (prisma.loan.aggregate as any).mockResolvedValue({
        _sum: { approvedAmount: new Prisma.Decimal(2000000) },
      });

      // Mock defaulted/active counts for rate
      (prisma.loan.count as any)
        .mockResolvedValueOnce(1) // defaulted
        .mockResolvedValueOnce(5); // active

      // Mock groupBy for donations
      (prisma.donorFund.groupBy as any).mockResolvedValue([
        { createdAt: new Date('2026-01-01'), _sum: { amount: new Prisma.Decimal(1000000) } },
      ]);

      // Mock groupBy for disbursements
      (prisma.loan.groupBy as any).mockResolvedValue([
        { approvedAt: new Date('2026-01-01'), _sum: { approvedAmount: new Prisma.Decimal(500000) } },
      ]);

      // Mock pending logs
      (prisma.loanApplication.findMany as any).mockResolvedValue([
        {
          id: 'loan-1',
          requestedAmount: new Prisma.Decimal(1000000),
          createdAt: new Date(),
          borrower: { name: 'Test Borrower', email: 'test@example.com' },
        },
      ]);

      const result = await AdminService.getDashboardSummary();

      expect(result.statistics.totalLoans).toBe(10);
      expect(result.statistics.pendingLoans).toBe(3);
      expect(result.statistics.totalDonationAmount).toBe(5000000);
      expect(result.statistics.totalDisbursed).toBe(2000000);
      expect(result.statistics.defaultRate).toBe(0.2);
      expect(result.analytics.monthlyDonations).toHaveLength(1);
      expect(result.pending_logs.pendingRequests).toHaveLength(1);
    });

    it('should handle zero active loans in default rate calculation', async () => {
       // Mock counts
       (prisma.loanApplication.count as any).mockResolvedValue(0);
       (prisma.donorFund.aggregate as any).mockResolvedValue({ _sum: { amount: null }, _count: 0 });
       (prisma.loan.aggregate as any).mockResolvedValue({ _sum: { approvedAmount: null } });
       
       (prisma.loan.count as any)
         .mockResolvedValueOnce(0) // defaulted
         .mockResolvedValueOnce(0); // active (zero)

       (prisma.donorFund.groupBy as any).mockResolvedValue([]);
       (prisma.loan.groupBy as any).mockResolvedValue([]);
       (prisma.loanApplication.findMany as any).mockResolvedValue([]);

       const result = await AdminService.getDashboardSummary();
       expect(result.statistics.defaultRate).toBe(0);
    });
  });

  describe('updateLoanStatus', () => {
    it('should update loan application status', async () => {
      const mockUpdatedLoan = { id: 'loan-1', status: 'APPROVED' };
      (prisma.loanApplication.update as any).mockResolvedValue(mockUpdatedLoan);

      const result = await AdminService.updateLoanStatus('loan-1', 'APPROVED');
      
      expect(result).toEqual(mockUpdatedLoan);
      expect(prisma.loanApplication.update).toHaveBeenCalledWith({
        where: { id: 'loan-1' },
        data: { status: 'APPROVED' },
      });
    });
  });
});
