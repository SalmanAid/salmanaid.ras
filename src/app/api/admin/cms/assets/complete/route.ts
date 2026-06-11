import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = process.env.SUPABASE_CMS_BUCKET_NAME || "cms-assets";
const CompleteSchema = z.object({
  storagePath: z.string().min(1).max(500),
  fileName: z.string().min(1).max(180),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
  sizeBytes: z.number().int().positive().max(1_500_000),
  width: z.number().int().positive().max(6000),
  height: z.number().int().positive().max(6000),
  defaultAlt: z.string().trim().max(180).optional(),
});

export async function POST(request: NextRequest) {
  const admin = await assertAdmin();
  if (!admin.ok) return admin.response;

  try {
    const input = CompleteSchema.parse(await request.json());
    const pathParts = input.storagePath.split("/");
    const fileName = pathParts.pop();
    const folder = pathParts.join("/");
    const { data: objects, error: listError } = await supabaseAdmin.storage
      .from(BUCKET)
      .list(folder, { search: fileName, limit: 5 });
    if (listError || !objects?.some((object) => object.name === fileName)) {
      return NextResponse.json({ error: "File upload tidak ditemukan" }, { status: 400 });
    }
    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(input.storagePath);
    const asset = await prisma.cmsAsset.create({
      data: {
        storagePath: input.storagePath,
        publicUrl: data.publicUrl,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        width: input.width,
        height: input.height,
        defaultAlt: input.defaultAlt || null,
        uploadedBy: admin.adminId,
      },
    });
    return NextResponse.json({ message: "Asset tersimpan", data: asset }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Metadata asset tidak valid" }, { status: 400 });
    }
    console.error("CMS asset completion error:", error);
    return NextResponse.json({ error: "Gagal menyimpan asset" }, { status: 500 });
  }
}
