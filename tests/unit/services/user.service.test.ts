import { describe, it, expect, vi } from 'vitest';
import { UserService } from '@/services/user.service';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

vi.mock('bcryptjs');

describe('UserService', () => {
  describe('verifyCredentials', () => {
    it('should return user info on successful verification', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        roles: [
          {
            role: { name: 'DONOR' },
          },
        ],
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await UserService.verifyCredentials('test@example.com', 'password123');

      expect(result).toEqual({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        roles: ['DONOR'],
      });
    });

    it('should return null if user is not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const result = await UserService.verifyCredentials('nonexistent@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null if passwords do not match', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        roles: [],
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await UserService.verifyCredentials('test@example.com', 'wrong-password');

      expect(result).toBeNull();
    });
  });
});
