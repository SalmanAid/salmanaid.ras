import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = performance.now();
  try {
    const [cmsDocuments, cmsAssets] = await prisma.$transaction([
      prisma.cmsDocument.count(),
      prisma.cmsAsset.count({ where: { isArchived: false } }),
    ]);
    const durationMs = Math.round(performance.now() - startedAt);
    const status = durationMs > 500 ? "degraded" : "healthy";
    console.info(JSON.stringify({ event: "cms_health", status, durationMs, cmsDocuments, cmsAssets }));
    return NextResponse.json({ status, durationMs, cmsDocuments, cmsAssets });
  } catch (error) {
    const durationMs = Math.round(performance.now() - startedAt);
    console.error(JSON.stringify({
      event: "cms_health",
      status: "unhealthy",
      durationMs,
      message: error instanceof Error ? error.message : "unknown",
    }));
    return NextResponse.json({ status: "unhealthy", durationMs }, { status: 503 });
  }
}
