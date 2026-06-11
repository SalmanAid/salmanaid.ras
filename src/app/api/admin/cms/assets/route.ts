import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = process.env.SUPABASE_CMS_BUCKET_NAME || "cms-assets";
const UploadIntentSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
  sizeBytes: z.number().int().positive().max(1_500_000),
  width: z.number().int().positive().max(6000),
  height: z.number().int().positive().max(6000),
  defaultAlt: z.string().trim().max(180).optional(),
});

async function ensureCmsBucket() {
  const { data } = await supabaseAdmin.storage.getBucket(BUCKET);
  if (data) return;

  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 1_500_000,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  });
  if (error && !error.message.toLowerCase().includes("already exists")) throw error;
}

export async function GET() {
  const admin = await assertAdmin();
  if (!admin.ok) return admin.response;

  const assets = await prisma.cmsAsset.findMany({
    where: { isArchived: false },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ data: assets });
}

export async function POST(request: NextRequest) {
  const admin = await assertAdmin();
  if (!admin.ok) return admin.response;

  try {
    const input = UploadIntentSchema.parse(await request.json());
    await ensureCmsBucket();
    const extension = input.mimeType === "image/avif" ? "avif" : input.mimeType === "image/png" ? "png" : input.mimeType === "image/jpeg" ? "jpg" : "webp";
    const storagePath = `${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${extension}`;
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(storagePath);
    if (error || !data) throw error || new Error("SIGNED_UPLOAD_FAILED");

    return NextResponse.json({
      data: {
        storagePath,
        bucket: BUCKET,
        token: data.token,
        signedUrl: data.signedUrl,
        metadata: input,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "File tidak valid" }, { status: 400 });
    }
    console.error("CMS asset intent error:", error);
    return NextResponse.json({ error: "Gagal menyiapkan upload" }, { status: 500 });
  }
}
