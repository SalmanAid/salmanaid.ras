import { NextResponse } from "next/server";
import { RegisterSchema } from "@/schemas/auth.schema";
import { UserService } from "@/services/user.service";
import { UserDocumentsService } from "@/services/user-documents.service";
import {
  AccountVerificationService,
  type UserDocumentType,
} from "@/services/account-verification.service";
import { validateFile } from "@/schemas/document.schema";

const REGISTER_DOCUMENT_TYPES: UserDocumentType[] = ["identityCard", "institutionCard", "familyCard"];
const REGISTER_IDENTITY_FIELDS = [
  { key: "name", label: "Nama" },
  { key: "nik", label: "NIK" },
  { key: "phone_number", label: "No. telepon" },
  { key: "address", label: "Alamat" },
] as const;

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function getFormFile(formData: FormData, key: UserDocumentType) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const role = getFormString(formData, "role");
      const parsed = RegisterSchema.safeParse({
        name: getFormString(formData, "name"),
        email: getFormString(formData, "email"),
        password: getFormString(formData, "password"),
        nik: getFormString(formData, "nik"),
        phone_number: getFormString(formData, "phone_number"),
        address: getFormString(formData, "address"),
        role,
      });

      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const selectedRole = parsed.data.role || "DONOR";
      const missingIdentityFields = REGISTER_IDENTITY_FIELDS.filter((field) => !parsed.data[field.key]?.trim());

      if (missingIdentityFields.length > 0) {
        return NextResponse.json(
          {
            error: "Data identitas belum lengkap",
            missingFields: missingIdentityFields.map((field) => field.label),
          },
          { status: 400 }
        );
      }

      const requiredDocuments = AccountVerificationService.getRequiredDocuments(selectedRole);
      const missingDocuments = requiredDocuments.filter((documentType) => !getFormFile(formData, documentType));

      if (missingDocuments.length > 0) {
        return NextResponse.json(
          {
            error: "Dokumen identitas belum lengkap",
            missingDocuments,
          },
          { status: 400 }
        );
      }

      for (const documentType of REGISTER_DOCUMENT_TYPES) {
        const file = getFormFile(formData, documentType);
        if (!file) continue;

        const fileValidation = validateFile(file);
        if (!fileValidation.valid) {
          return NextResponse.json(
            { error: fileValidation.error, documentType },
            { status: 400 }
          );
        }
      }

      const user = await UserService.register(parsed.data);

      for (const documentType of requiredDocuments) {
        const file = getFormFile(formData, documentType);
        if (file) {
          await UserDocumentsService.uploadUserDocument(user.id, documentType, file);
        }
      }

      return NextResponse.json(
        {
          message: "Registrasi berhasil. Akun Anda menunggu verifikasi admin.",
          user,
        },
        { status: 201 }
      );
    }

    const body = await req.json();

    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const user = await UserService.register(parsed.data);
    return NextResponse.json({ message: "Registrasi berhasil", user }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_TAKEN") {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "NIK_TAKEN") {
      return NextResponse.json({ error: "NIK sudah terdaftar" }, { status: 400 });
    }
    console.error("Register error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}
