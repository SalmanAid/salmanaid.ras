// lib/whatsapp.ts
import axios from "axios";

export async function sendWhatsAppExpiryReminder(phoneNumber: string, userName: string, daysLeft: number) {
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const message = `Halo ${userName}, pengajuan pinjaman Anda akan berakhir dalam ${daysLeft} hari. Segera lakukan pengecekan pada dashboard Anda.`;

  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "template",
        template: {
          name: "loan_expiry_reminder", // Must be pre-approved in Meta Dashboard
          language: { code: "id" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: userName }, { type: "text", text: daysLeft.toString() }]
            }
          ]
        }
      },
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
    );
  } catch (error) {
    console.error("WhatsApp API Error:", error);
  }
}