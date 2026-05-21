import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AccountVerificationService } from "@/services/account-verification.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100).optional(),
  phone_number: z.string().max(30).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const overview = await AccountVerificationService.getUserAccountOverview(session.user.id);
    return NextResponse.json({ data: overview }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    console.error("Get user overview error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = UpdateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: parsed.data,
    });

    const overview = await AccountVerificationService.getUserAccountOverview(session.user.id);
    return NextResponse.json({ message: "Profil berhasil diperbarui", data: overview }, { status: 200 });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
