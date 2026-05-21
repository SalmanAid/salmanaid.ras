import { auth } from "@/auth";
import { UserDocumentsService } from "@/services/user-documents.service";
import type { UserDocumentType } from "@/services/account-verification.service";
import { NextRequest, NextResponse } from "next/server";

const USER_DOCUMENT_TYPES: UserDocumentType[] = ["identityCard", "institutionCard", "familyCard"];

/**
 * POST /api/user/documents/upload
 * Upload identity card or family card
 * Body: FormData with "file" and "documentType" fields
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as UserDocumentType;

    if (!file) {
      return NextResponse.json(
        { error: "FILE_REQUIRED" },
        { status: 400 }
      );
    }

    if (!USER_DOCUMENT_TYPES.includes(documentType)) {
      return NextResponse.json(
        { error: "INVALID_DOCUMENT_TYPE" },
        { status: 400 }
      );
    }

    const result = await UserDocumentsService.uploadUserDocument(
      session.user.id,
      documentType,
      file
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Upload error:", error);

    if (error.message === "FILE_TOO_LARGE") {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 413 }
      );
    }
    if (error.message === "UPLOAD_FAILED") {
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/documents?documentType=identityCard
 * Get signed URL for a document
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const documentType = request.nextUrl.searchParams.get("documentType") as
      | UserDocumentType
      | null;

    if (!documentType) {
      return NextResponse.json(
        { error: "DOCUMENT_TYPE_REQUIRED" },
        { status: 400 }
      );
    }

    if (!USER_DOCUMENT_TYPES.includes(documentType)) {
      return NextResponse.json(
        { error: "INVALID_DOCUMENT_TYPE" },
        { status: 400 }
      );
    }

    const result = await UserDocumentsService.getUserDocumentUrl(
      session.user.id,
      documentType
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Get document error:", error);

    if (error.message === "USER_NOT_FOUND") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    if (
      error.message === "IDENTITYCARD_NOT_FOUND" ||
      error.message === "INSTITUTIONCARD_NOT_FOUND" ||
      error.message === "FAMILYCARD_NOT_FOUND"
    ) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/documents?documentType=identityCard
 * Delete a document
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const documentType = request.nextUrl.searchParams.get("documentType") as
      | UserDocumentType
      | null;

    if (!documentType) {
      return NextResponse.json(
        { error: "DOCUMENT_TYPE_REQUIRED" },
        { status: 400 }
      );
    }

    if (!USER_DOCUMENT_TYPES.includes(documentType)) {
      return NextResponse.json(
        { error: "INVALID_DOCUMENT_TYPE" },
        { status: 400 }
      );
    }

    await UserDocumentsService.deleteUserDocument(session.user.id, documentType);

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Delete document error:", error);

    if (error.message === "USER_NOT_FOUND") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    if (
      error.message === "IDENTITYCARD_NOT_FOUND" ||
      error.message === "INSTITUTIONCARD_NOT_FOUND" ||
      error.message === "FAMILYCARD_NOT_FOUND"
    ) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
