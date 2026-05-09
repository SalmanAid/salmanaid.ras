import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/auth/register/route';
import { UserService } from '@/services/user.service';
import { NextRequest } from 'next/server';

describe('POST /api/auth/register', () => {
  it('registers a new user successfully', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    vi.spyOn(UserService, 'register').mockResolvedValue(mockUser as any);

    const req = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    const response = await POST(req);
    const result = await response.json();

    expect(response.status).toBe(201);
    expect(result.user).toEqual(mockUser);
  });

  it('returns 400 for invalid data', async () => {
    const req = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: '123',
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
