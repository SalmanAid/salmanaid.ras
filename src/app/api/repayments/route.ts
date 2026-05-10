import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CreateRepaymentSchema } from "@/schemas/repayment.schema";
import { RepaymentService } from "@/services/repayment.service";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check
    const userRoles = (session.user as any).roles || [];
    if (!userRoles.includes("ADMIN")) {
      return NextResponse.json({ error: "Hanya admin yang dapat mencatat pembayaran" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = CreateRepaymentSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Call service to handle DB logic
    const repayment = await RepaymentService.recordRepayment(parsed.data);

    return NextResponse.json(
      {
        message: "Pembayaran berhasil dicatat",
        data: repayment,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      // Specific business logic error handling
      if (error.message === "LOAN_NOT_FOUND") {
        return NextResponse.json({ error: "Pinjaman tidak ditemukan" }, { status: 404 });
      }
      if (error.message === "INVALID_AMOUNT") {
        return NextResponse.json({ error: "Jumlah pembayaran tidak valid" }, { status: 400 });
      }
      if (error.message === "OVERPAYMENT") {
        return NextResponse.json({ error: "Jumlah melebihi sisa hutang" }, { status: 400 });
      }
    }

    // Handle Prisma concurrency/transaction errors
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034") {
      return NextResponse.json(
        { error: "Transaksi sedang diproses oleh request lain, coba lagi" },
        { status: 409 }
      );
    }

    console.error("Create repayment error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}