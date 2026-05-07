import crypto from "node:crypto";
import type { SendWhatsAppMessageInput } from "@/schemas/whatsapp.schema";
import { SendWhatsAppMessageSchema } from "@/schemas/whatsapp.schema";

type WhatsAppApiResponse = {
  ok?: boolean;
  to?: string;
  messageId?: string;
  error?: string;
  [key: string]: unknown;
};

type WhatsAppErrorOptions = {
  status?: number;
  data?: unknown;
};

export class WhatsAppServiceError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, options: WhatsAppErrorOptions = {}) {
    super(message);
    this.name = "WhatsAppServiceError";
    this.status = options.status ?? 500;
    this.data = options.data ?? null;
  }
}

function cleanEnvValue(value: string | undefined) {
  return (value || "").trim().replace(/^["']|["']$/g, "");
}

function requireConfig() {
  const apiUrl = cleanEnvValue(process.env.WA_API_URL).replace(/\/+$/, "");
  const apiToken = cleanEnvValue(process.env.WA_API_TOKEN);
  const hmacSecret = cleanEnvValue(process.env.WA_HMAC_SECRET);

  if (!apiUrl || !apiToken || !hmacSecret) {
    throw new WhatsAppServiceError("Missing WhatsApp API configuration", {
      status: 500,
      data: {
        missing: {
          WA_API_URL: !apiUrl,
          WA_API_TOKEN: !apiToken,
          WA_HMAC_SECRET: !hmacSecret,
        },
      },
    });
  }

  return { apiUrl, apiToken, hmacSecret };
}

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text) as WhatsAppApiResponse;
  } catch {
    return { raw: text };
  }
}

export const WhatsAppService = {
  async sendMessage(input: SendWhatsAppMessageInput) {
    const parsed = SendWhatsAppMessageSchema.parse(input);
    const { apiUrl, apiToken, hmacSecret } = requireConfig();

    const body = JSON.stringify({
      to: parsed.to,
      message: parsed.message,
    });
    const timestamp = Date.now().toString();
    const signature = crypto
      .createHmac("sha256", hmacSecret)
      .update(`${timestamp}.${body}`)
      .digest("hex");

    const response = await fetch(`${apiUrl}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
        "X-Timestamp": timestamp,
        "X-Signature": signature,
      },
      body,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new WhatsAppServiceError(
        `WhatsApp API request failed with ${response.status}`,
        {
          status: response.status,
          data,
        }
      );
    }

    return data as WhatsAppApiResponse;
  },
};
