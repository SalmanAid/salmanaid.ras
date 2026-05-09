import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminDashboard_RecentActivityTable from '@/components/ui/admin-dashboard/recent_activity_table';

vi.mock('@/hooks/adminDashboardStore', () => ({
  useAdminDashboardStore: vi.fn(),
}));

import { useAdminDashboardStore } from '@/hooks/adminDashboardStore';

describe('AdminDashboard_RecentActivityTable', () => {
  it('renders "No recent activity" when list is empty', () => {
    (useAdminDashboardStore as any).mockReturnValue({ pendingRequests: [] });
    
    render(<AdminDashboard_RecentActivityTable />);
    expect(screen.getByText(/no recent activity/i)).toBeDefined();
  });

  it('renders activity rows when data is present', () => {
    const mockRequests = [
      {
        id: '1',
        borrower: { name: 'John Doe' },
        requestedAmount: 1000000,
        requestedAt: new Date(),
      },
    ];
    (useAdminDashboardStore as any).mockReturnValue({ pendingRequests: mockRequests });

    render(<AdminDashboard_RecentActivityTable />);
    expect(screen.getByText(/new application submitted from/i)).toBeDefined();
    expect(screen.getByText('John Doe')).toBeDefined();
  });
});
