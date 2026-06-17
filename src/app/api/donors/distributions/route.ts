import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { DonorTrackingService } from "@/services/donor-tracking.service";

export async function GET(request: Request) {
  try {
    const session = await auth();

    // Ensure the user is authenticated
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized Access" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const roles = (session.user as any).roles || [];
    const isAdmin = roles.includes("ADMIN");

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    const start = startParam ? parseInt(startParam, 10) : undefined;
    const end = endParam ? parseInt(endParam, 10) : undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    
    let targetDonorId = searchParams.get("donorId");

    if (targetDonorId) {
      if (!isAdmin && targetDonorId !== userId) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You cannot access other donor's data." },
          { status: 403 }
        );
      }
    } else {
      if (!isAdmin) {
        targetDonorId = userId;
      }
    }

    // Fetch the breakdown
    const { distributions, total } = await DonorTrackingService.getDonorDistributions({
      donorId: targetDonorId || undefined,
      limit,
      start,
      end,
      status,
      search
    });

    return NextResponse.json({
      success: true,
      data: { distributions, total }
    });

  } catch (error) {
    console.error("[DONOR_DISTRIBUTIONS_GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}
