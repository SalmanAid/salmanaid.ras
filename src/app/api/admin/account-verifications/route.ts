import { auth } from "@/auth";
import { AccountVerificationStatus } from "@/generated/prisma";
import { z } from "zod";
import {
  AccountVerificationService,
  type VerifiableRole,
} from "@/services/account-verification.service";
import { NextRequest, NextResponse } from "next/server";

const StatusSchema = z.enum(["PENDING", "VERIFIED", "REJECTED", "REVISION_REQUESTED"]);

const UpdateVerificationSchema = z.object({
  userId: z.string().uuid("userId tidak valid"),
  role: z.enum(["DONOR", "BORROWER"]),
  status: StatusSchema,
  message: z.string().max(500).optional().nullable(),
}).refine((data) => {
  if (data.status === "REVISION_REQUESTED" || data.status === "REJECTED") {
    return Boolean(data.message?.trim());
  }

  return true;
}, {
  message: "Pesan wajib diisi untuk status ditolak atau minta perbaikan",
  path: ["message"],
});

async function assertAdmin() {
  const session = await auth();
  const roles = ((session?.user as { roles?: string[] } | undefined)?.roles || []) as string[];

  if (!session?.user?.id) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!roles.includes("ADMIN")) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const, adminId: session.user.id };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await assertAdmin();
    if (!admin.ok) return admin.response;

    const statusParam = request.nextUrl.searchParams.get("status");
    const search = request.nextUrl.searchParams.get("search")?.trim().slice(0, 100) || undefined;
    const parsedStatus = statusParam ? StatusSchema.safeParse(statusParam) : null;

    if (statusParam && !parsedStatus?.success) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    const requests = await AccountVerificationService.listVerificationRequests(
      parsedStatus?.success ? parsedStatus.data as AccountVerificationStatus : undefined,
      search
    );

    return NextResponse.json({ data: requests }, { status: 200 });
  } catch (error) {
    console.error("List account verification error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await assertAdmin();
    if (!admin.ok) return admin.response;

    const body = await request.json();
    const parsed = UpdateVerificationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const result = await AccountVerificationService.updateVerificationDecision({
      userId: parsed.data.userId,
      role: parsed.data.role as VerifiableRole,
      adminId: admin.adminId,
      status: parsed.data.status as AccountVerificationStatus,
      message: parsed.data.message,
    });

    return NextResponse.json(
      { message: "Status verifikasi berhasil diperbarui", data: result },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ROLE_NOT_FOUND") {
        return NextResponse.json({ error: "Role user tidak ditemukan" }, { status: 404 });
      }

      if (error.message.startsWith("MISSING_DOCUMENTS:")) {
        const missingDocuments = error.message.replace("MISSING_DOCUMENTS:", "").split(",").filter(Boolean);
        return NextResponse.json(
          { error: "Dokumen belum lengkap", missingDocuments },
          { status: 400 }
        );
      }

      if (error.message.startsWith("MISSING_IDENTITY:")) {
        const missingIdentityFields = error.message.replace("MISSING_IDENTITY:", "").split(",").filter(Boolean);
        return NextResponse.json(
          { error: "Data identitas belum lengkap", missingIdentityFields },
          { status: 400 }
        );
      }
    }

    console.error("Update account verification error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
