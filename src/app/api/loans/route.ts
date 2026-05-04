import { NextRequest, NextResponse } from "next/server";
import { LoanApplicationSchema } from "@/schemas/loan.schema";
import { LoanService } from "@/services/loan.service";
import { LoanApplicationStatus, LoanStatus } from "@/generated/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    // 1. Extract the URL from the request
    const { searchParams } = new URL(req.url);

    // 2. Get parameters from query string
    // Note: searchParams.get() always returns a string or null
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");
    const status = searchParams.get("status"); // Default to PENDING if not provided

    // 3. Convert start/end to numbers (and handle defaults)
    const start = startStr ? parseInt(startStr, 10) : 0;
    const end = endStr ? parseInt(endStr, 10) : 10;

    // 4. get loan requests
    let result;
    if (status) {
      result = await LoanService.getAllLoans(
        start,
        end,
        status == "DEFAULTED" ? LoanStatus.DEFAULTED : (status == "ACTIVE" ? LoanStatus.ACTIVE : (status == "PAID" ? LoanStatus.PAID : LoanStatus.FORGIVEN))
      ) 
    } else {
      result = await LoanService.getAllLoans(
        start,
        end
      ) 
    }

    return NextResponse.json({ data: result }, { status: 200 });
    
  } catch (error) {
    console.error("Fetch loan error:", error);
    
    if (error instanceof Error) {
      if (error.message === "APPLICATION_NOT_FOUND") {
        return NextResponse.json({ error: "Aplikasi tidak ditemukan" }, { status: 404 });
      }
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Anda tidak memiliki akses ke aplikasi ini" }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}
