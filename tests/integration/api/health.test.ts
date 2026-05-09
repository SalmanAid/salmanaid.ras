import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/health/route';
import { prisma } from '@/lib/prisma';

describe('GET /api/health', () => {
  it('returns ok status when database is connected', async () => {
    (prisma.$queryRaw as any).mockResolvedValue([{ 1: 1 }]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ status: 'ok', db: 'connected' });
  });

  it('returns error status when database fails', async () => {
    (prisma.$queryRaw as any).mockRejectedValue(new Error('DB Error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data).toEqual({ status: 'error', db: 'disconnected' });
  });
});
