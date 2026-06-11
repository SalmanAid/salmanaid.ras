import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { CmsService } from "@/services/cms.service";

type Context = { params: Promise<{ key: string; revisionId: string }> };
const RestoreSchema = z.object({ changeNote: z.string().trim().max(300).optional() });

export async function POST(request: NextRequest, context: Context) {
  const admin = await assertAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { key, revisionId } = await context.params;
    const input = RestoreSchema.parse(await request.json().catch(() => ({})));
    const data = await CmsService.restoreRevision({
      key,
      revisionId,
      adminId: admin.adminId,
      changeNote: input.changeNote,
    });
    return NextResponse.json({ message: "Revision berhasil dipulihkan dan dipublish", data });
  } catch (error) {
    if (error instanceof Error && error.message === "CMS_REVISION_NOT_FOUND") {
      return NextResponse.json({ error: "Revision tidak ditemukan" }, { status: 404 });
    }
    console.error("CMS revision restore error:", error);
    return NextResponse.json({ error: "Gagal memulihkan revision" }, { status: 500 });
  }
}
