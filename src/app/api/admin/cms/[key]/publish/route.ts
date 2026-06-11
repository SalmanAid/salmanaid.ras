import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { PublishSchema } from "@/schemas/cms.schema";
import { CmsConflictError, CmsService } from "@/services/cms.service";

type Context = { params: Promise<{ key: string }> };

export async function POST(request: NextRequest, context: Context) {
  const admin = await assertAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { key } = await context.params;
    const input = PublishSchema.parse(await request.json());
    const data = await CmsService.publish({
      key,
      adminId: admin.adminId,
      expectedDraftVersion: input.expectedDraftVersion,
      changeNote: input.changeNote,
    });
    return NextResponse.json({ message: "Konten berhasil dipublikasikan", data });
  } catch (error) {
    if (error instanceof CmsConflictError) {
      return NextResponse.json({ error: "Draft berubah. Muat ulang sebelum publish." }, { status: 409 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Konten belum siap dipublish", issues: error.issues }, { status: 400 });
    }
    console.error("CMS publish error:", error);
    return NextResponse.json({ error: "Gagal mempublikasikan konten" }, { status: 500 });
  }
}
