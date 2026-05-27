import { auth } from "@/auth";
import { ROLES } from "@/lib/roles";
import { validateFile } from "@/schemas/document.schema";
import {
  AccountVerificationService,
  type UserDocumentType,
  type VerifiableRole,
} from "@/services/account-verification.service";
import { UserDocumentsService } from "@/services/user-documents.service";
import { NextRequest, NextResponse } from "next/server";

const USER_DOCUMENT_TYPES: UserDocumentType[] = ["identityCard", "institutionCard", "familyCard"];

function parseRole(value: FormDataEntryValue | null): VerifiableRole | null {
  if (value === ROLES.DONOR || value === ROLES.BORROWER) {
    return value;
  }

  return null;
}

function getFormFile(formData: FormData, key: UserDocumentType) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const formData = await request.formData();
    const role = parseRole(formData.get("role"));

    if (!role) {
      return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
    }

    for (const documentType of USER_DOCUMENT_TYPES) {
      const file = getFormFile(formData, documentType);
      if (!file) continue;

      const validation = validateFile(file);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error, documentType },
          { status: 400 }
        );
      }

      await UserDocumentsService.uploadUserDocument(session.user.id, documentType, file);
    }

    const userRole = await AccountVerificationService.addRoleToUser({
      userId: session.user.id,
      role,
    });

    return NextResponse.json(
      {
        message: "Role berhasil didaftarkan dan menunggu verifikasi admin.",
        data: userRole,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "USER_NOT_FOUND") {
        return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
      }

      if (error.message.startsWith("MISSING_DOCUMENTS:")) {
        const missingDocuments = error.message.replace("MISSING_DOCUMENTS:", "").split(",").filter(Boolean);
        return NextResponse.json(
          { error: "Dokumen untuk role ini belum lengkap", missingDocuments },
          { status: 400 }
        );
      }

      if (error.message.startsWith("MISSING_IDENTITY:")) {
        const missingIdentityFields = error.message.replace("MISSING_IDENTITY:", "").split(",").filter(Boolean);
        return NextResponse.json(
          { error: "Lengkapi data identitas di halaman profil sebelum mendaftarkan role tambahan", missingIdentityFields },
          { status: 400 }
        );
      }
    }

    console.error("Add role error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
