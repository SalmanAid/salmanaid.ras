import { auth } from "@/auth";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { AccountVerificationService } from "@/services/account-verification.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100).optional(),
  nik: z.string().regex(/^\d{16}$/, "NIK harus terdiri dari 16 digit angka").nullable().optional(),
  phone_number: z.string()
    .min(8, "No. telepon minimal 8 karakter")
    .max(30, "No. telepon maksimal 30 karakter")
    .regex(/^\+?[0-9\s-]+$/, "No. telepon hanya boleh berisi angka, spasi, tanda +, atau tanda -")
    .nullable()
    .optional(),
  address: z.string().max(500).nullable().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const userId = session.user.id;

    const overview = await AccountVerificationService.getUserAccountOverview(userId);
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
    const userId = session.user.id;

    const body = await request.json();
    const parsed = UpdateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        nik: true,
        phone_number: true,
        address: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const identityFields = ["nik", "phone_number", "address"] as const;
    const hasIdentityChange = identityFields.some((field) => {
      if (!Object.prototype.hasOwnProperty.call(parsed.data, field)) return false;
      return (parsed.data[field] || null) !== currentUser[field];
    });

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: parsed.data,
      });

      if (hasIdentityChange) {
        await AccountVerificationService.markRolesPendingAfterIdentityUpdate(userId, tx);
      }
    });

    const overview = await AccountVerificationService.getUserAccountOverview(userId);
    return NextResponse.json({ message: "Profil berhasil diperbarui", data: overview }, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "NIK sudah terdaftar" }, { status: 400 });
    }

    console.error("Update profile error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
