import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { CmsConflictError, CmsService } from "@/services/cms.service";
import { DraftSaveSchema } from "@/schemas/cms.schema";

type Context = { params: Promise<{ key: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const admin = await assertAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { key } = await context.params;
    return NextResponse.json({ data: await CmsService.getAdminDocument(key) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Dokumen CMS tidak valid" }, { status: 400 });
    }
    console.error("CMS document read error:", error);
    return NextResponse.json({ error: "Gagal memuat dokumen CMS" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  const admin = await assertAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { key } = await context.params;
    const input = DraftSaveSchema.parse(await request.json());
    const data = await CmsService.saveDraft({
      key,
      content: input.content,
      expectedDraftVersion: input.expectedDraftVersion,
      adminId: admin.adminId,
    });
    return NextResponse.json({ message: "Draft tersimpan", data });
  } catch (error) {
    if (error instanceof CmsConflictError) {
      return NextResponse.json(
        { error: "Draft telah diubah admin lain. Muat ulang sebelum melanjutkan." },
        { status: 409 }
      );
    }
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Konten belum valid", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("CMS draft save error:", error);
    return NextResponse.json({ error: "Gagal menyimpan draft" }, { status: 500 });
  }
}
