import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
  }),
}));

// Mock Next.js navigation (App Router)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Prisma
import { mockDeep, mockReset } from 'vitest-mock-extended';
vi.mock('@/lib/prisma', () => ({
  prisma: mockDeep(),
}));

import { prisma } from '@/lib/prisma';
import { beforeEach } from 'vitest';

beforeEach(() => {
  mockReset(prisma);
});
