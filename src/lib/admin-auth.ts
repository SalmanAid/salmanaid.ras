import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function assertAdmin() {
  const session = await auth();
  const roles = ((session?.user as { roles?: string[] } | undefined)?.roles || []);

  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!roles.includes("ADMIN")) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true as const, adminId: session.user.id };
}
