import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin-auth";
import { CmsService } from "@/services/cms.service";

type Context = { params: Promise<{ key: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const admin = await assertAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { key } = await context.params;
    return NextResponse.json({ data: await CmsService.listRevisions(key) });
  } catch (error) {
    console.error("CMS revisions read error:", error);
    return NextResponse.json({ error: "Gagal memuat riwayat" }, { status: 500 });
  }
}
