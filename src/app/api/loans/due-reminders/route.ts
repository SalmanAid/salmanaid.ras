import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { LoanService } from "@/services/loan.service";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles = ((session.user as { roles?: string[] }).roles || []) as string[];
    if (!roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "Hanya admin yang dapat mengakses reminder jatuh tempo" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const daysParam = url.searchParams.get("days");

    if (!daysParam) {
      const result = await LoanService.getBorrowersWithDueReminders();
      return NextResponse.json({ data: result }, { status: 200 });
    }

    if (daysParam !== "7" && daysParam !== "14") {
      return NextResponse.json(
        { error: "Parameter days hanya boleh bernilai 7 atau 14" },
        { status: 400 }
      );
    }

    const result = await LoanService.getBorrowersWithDueReminderByDays(
      Number(daysParam) as 7 | 14
    );

    return NextResponse.json(
      {
        data: {
          days: Number(daysParam),
          borrowers: result,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get due reminders error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem" },
      { status: 500 }
    );
  }
}
