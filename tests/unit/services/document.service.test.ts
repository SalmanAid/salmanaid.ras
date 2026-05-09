import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentService } from '@/services/document.service';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn(),
      createSignedUrl: vi.fn(),
      remove: vi.fn(),
    },
  },
}));

describe('DocumentService', () => {
  const mockUserId = 'user-1';
  const mockAppId = '00000000-0000-0000-0000-000000000001';
  const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

  describe('uploadDocument', () => {
    it('should upload to supabase and save to prisma', async () => {
      // Mock application check
      (prisma.loanApplication.findUnique as any).mockResolvedValue({
        id: mockAppId,
        borrowerId: mockUserId,
      });

      // Mock supabase success
      (supabaseAdmin.storage.from('').upload as any).mockResolvedValue({ error: null });

      // Mock prisma create
      const mockAttachment = { id: 'attach-1', fileUrl: 'path/to/file' };
      (prisma.applicationAttachment.create as any).mockResolvedValue(mockAttachment);

      const result = await DocumentService.uploadDocument(
        mockUserId,
        ['BORROWER'],
        mockAppId,
        'student_id_card',
        mockFile
      );

      expect(result).toEqual(mockAttachment);
      expect(supabaseAdmin.storage.from).toHaveBeenCalledWith(expect.any(String));
      expect(prisma.applicationAttachment.create).toHaveBeenCalled();
    });

    it('should throw error if application not found', async () => {
      (prisma.loanApplication.findUnique as any).mockResolvedValue(null);

      await expect(DocumentService.uploadDocument(
        mockUserId, [], mockAppId, 'type', mockFile
      )).rejects.toThrow('APPLICATION_NOT_FOUND');
    });

    it('should throw error if unauthorized', async () => {
      (prisma.loanApplication.findUnique as any).mockResolvedValue({
        id: mockAppId,
        borrowerId: 'other-user',
      });

      await expect(DocumentService.uploadDocument(
        mockUserId, ['BORROWER'], mockAppId, 'type', mockFile
      )).rejects.toThrow('UNAUTHORIZED');
    });
  });

  describe('getAttachmentsForApplication', () => {
    it('should return signed URLs for attachments', async () => {
      (prisma.loanApplication.findUnique as any).mockResolvedValue({
        id: mockAppId,
        borrowerId: mockUserId,
      });

      (prisma.applicationAttachment.findMany as any).mockResolvedValue([
        { id: '1', fileUrl: 'path1' },
      ]);

      (supabaseAdmin.storage.from('').createSignedUrl as any).mockResolvedValue({
        data: { signedUrl: 'https://signed.url' },
      });

      const result = await DocumentService.getAttachmentsForApplication(
        mockAppId, mockUserId, ['BORROWER']
      );

      expect(result[0].fileUrl).toBe('https://signed.url');
    });
  });
});
