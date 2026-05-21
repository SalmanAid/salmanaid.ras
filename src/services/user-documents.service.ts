import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";
import {
  AccountVerificationService,
  type UserDocumentType,
} from "@/services/account-verification.service";

const BUCKET_NAME = process.env.SUPABASE_USER_BUCKET_NAME || "user-documents";
const USER_DOCUMENT_TYPES: UserDocumentType[] = ["identityCard", "institutionCard", "familyCard"];

export const UserDocumentsService = {
  /**
   * Uploads identity, institution, or family card to Supabase Storage and updates User record.
   */
  async uploadUserDocument(
    userId: string,
    documentType: UserDocumentType,
    file: File
  ) {
    // Validate file exists and is not too large
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("FILE_TOO_LARGE");
    }

    if (!USER_DOCUMENT_TYPES.includes(documentType)) {
      throw new Error("INVALID_DOCUMENT_TYPE");
    }

    // Upload file to Supabase
    const fileExt = file.name.split(".").pop() || "bin";
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    // Format: users/userId/documentType/filename.ext
    const storagePath = `${userId}/${documentType}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      throw new Error("UPLOAD_FAILED");
    }

    // Update user record with file path and upload timestamp
    const updateData: any = {
      [documentType]: storagePath,
      [`${documentType}UploadedAt`]: new Date(),
    };

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: updateData,
      });

      await AccountVerificationService.markRolesPendingAfterDocumentUpdate(
        userId,
        documentType,
        tx
      );

      return user;
    });

    return {
      success: true,
      documentType,
      uploadedAt: updatedUser[`${documentType}UploadedAt` as keyof typeof updatedUser],
    };
  },

  /**
   * Get signed URL for a user's document.
   * Returns a temporary signed URL valid for 3600 seconds (1 hour).
   */
  async getUserDocumentUrl(
    userId: string,
    documentType: UserDocumentType
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const storagePath = user[documentType as keyof typeof user] as string | null;

    if (!storagePath) {
      throw new Error(`${documentType.toUpperCase()}_NOT_FOUND`);
    }

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, 3600);

    if (error || !data?.signedUrl) {
      console.error("Supabase signed URL error:", error);
      throw new Error("SIGN_URL_FAILED");
    }

    return {
      signedUrl: data.signedUrl,
      documentType,
      uploadedAt: user[`${documentType}UploadedAt` as keyof typeof user],
    };
  },

  /**
   * Get both documents for a user (with signed URLs if they exist).
   */
  async getUserDocuments(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const documents: any = {};

    for (const docType of USER_DOCUMENT_TYPES) {
      const storagePath = user[docType as keyof typeof user] as string | null;
      if (storagePath) {
        try {
          const { data } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .createSignedUrl(storagePath, 3600);

          documents[docType] = {
            signedUrl: data?.signedUrl || null,
            uploadedAt: user[`${docType}UploadedAt` as keyof typeof user],
          };
        } catch (error) {
          documents[docType] = null;
        }
      }
    }

    return documents;
  },

  /**
   * Delete a user document from Supabase Storage and update user record.
   */
  async deleteUserDocument(
    userId: string,
    documentType: UserDocumentType
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const storagePath = user[documentType as keyof typeof user] as string | null;

    if (!storagePath) {
      throw new Error(`${documentType.toUpperCase()}_NOT_FOUND`);
    }

    // Delete from Supabase Storage
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.error("Supabase delete error:", error);
      throw new Error("DELETE_STORAGE_FAILED");
    }

    // Update user record to remove the reference
    const updateData: any = {
      [documentType]: null,
      [`${documentType}UploadedAt`]: null,
    };

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: updateData,
      });

      await AccountVerificationService.markRolesPendingAfterDocumentUpdate(
        userId,
        documentType,
        tx
      );
    });

    return true;
  },
};
