import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ assetId: string }> };
const UpdateSchema = z.object({
  isArchived: z.boolean().optional(),
  defaultAlt: z.string().trim().max(180).optional(),
  focalX: z.number().int().min(0).max(100).optional(),
  focalY: z.number().int().min(0).max(100).optional(),
});

export async function PATCH(request: NextRequest, context: Context) {
  const admin = await assertAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { assetId } = await context.params;
    const input = UpdateSchema.parse(await request.json());
    const data = await prisma.cmsAsset.update({ where: { id: assetId }, data: input });
    return NextResponse.json({ message: "Asset diperbarui", data });
  } catch (error) {
    console.error("CMS asset update error:", error);
    return NextResponse.json({ error: "Gagal memperbarui asset" }, { status: 500 });
  }
}
