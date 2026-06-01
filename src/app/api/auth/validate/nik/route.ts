import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nik } = body;

    if (!nik || typeof nik !== "string") {
      return NextResponse.json(
        { error: "NIK is required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { nik: nik.trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { available: false, message: "NIK sudah terdaftar" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { available: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("NIK validation error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem" },
      { status: 500 }
    );
  }
}
