import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { SendWhatsAppMessageSchema } from "@/schemas/whatsapp.schema";
import { WhatsAppService, WhatsAppServiceError } from "@/services/whatsapp.service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles = ((session.user as { roles?: string[] }).roles || []) as string[];
    if (!roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "Hanya admin yang dapat mengirim pesan WhatsApp manual" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = SendWhatsAppMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const result = await WhatsAppService.sendMessage(parsed.data);

    return NextResponse.json(
      {
        message: "Pesan WhatsApp berhasil dikirim",
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof WhatsAppServiceError) {
      console.error("WhatsApp API request failed:", {
        status: error.status,
        data: error.data,
      });

      return NextResponse.json(
        {
          error: "Gagal mengirim pesan WhatsApp",
          details: error.data,
        },
        { status: error.status }
      );
    }

    console.error("Send WhatsApp message error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem" },
      { status: 500 }
    );
  }
}
