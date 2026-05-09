import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/admin/dashboard/route';
import { AdminService } from '@/services/admin.service';
import { NextRequest } from 'next/server';

describe('GET /api/admin/dashboard', () => {
  it('returns rekapitulasi data successfully', async () => {
    const mockData = { statistics: {}, analytics: {}, pending_logs: {} };
    vi.spyOn(AdminService, 'getDashboardSummary').mockResolvedValue(mockData as any);

    const req = new NextRequest('http://localhost/api/admin/dashboard');
    const response = await GET(req);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.data).toEqual(mockData);
  });

  it('handles service errors gracefully', async () => {
    vi.spyOn(AdminService, 'getDashboardSummary').mockRejectedValue(new Error('Fetch failed'));

    const req = new NextRequest('http://localhost/api/admin/dashboard');
    const response = await GET(req);
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.error).toBe('Fetch failed');
  });
});
