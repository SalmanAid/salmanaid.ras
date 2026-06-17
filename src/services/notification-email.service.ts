import { Resend } from "resend";

type NotificationEmailInput = {
  to: string;
  subject: string;
  message: string;
};

function toHtml(message: string) {
  if (/<\/?[a-z][\s\S]*>/i.test(message)) {
    return message;
  }

  return `<p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toText(message: string) {
  return message
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const NotificationEmailService = {
  async send(input: NotificationEmailInput) {
    if (!process.env.RESEND_API_KEY || !process.env.NOTIFICATION_EMAIL_FROM) {
      return { skipped: true };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: process.env.NOTIFICATION_EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: toHtml(input.message),
      text: toText(input.message),
    });

    if (result.error) {
      console.error("Notification email failed:", result.error);
    }

    return { skipped: false };
  },
};
