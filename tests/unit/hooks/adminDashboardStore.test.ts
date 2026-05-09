import { describe, it, expect, beforeEach } from 'vitest';
import { useAdminDashboardStore } from '@/hooks/adminDashboardStore';
import { act, renderHook } from '@testing-library/react';

describe('useAdminDashboardStore', () => {
  beforeEach(() => {
    act(() => {
      useAdminDashboardStore.setState({
        statistics: null,
        analytics: null,
        pending_logs: null,
      });
    });
  });

  it('should update statistics', () => {
    const { result } = renderHook(() => useAdminDashboardStore());
    const mockStats = {
      totalLoans: 10,
      pendingLoans: 2,
      totalDonations: 5,
      totalDonationAmount: 1000,
      totalDisbursed: 500,
      defaultRate: 0.1,
    };

    act(() => {
      result.current.setStatistics(mockStats);
    });

    expect(result.current.statistics).toEqual(mockStats);
  });
});
