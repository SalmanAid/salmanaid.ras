import { z } from "zod";

export const SendWhatsAppMessageSchema = z.object({
  to: z.string().trim().min(1, "Nomor HP tujuan wajib diisi"),
  message: z
    .string()
    .trim()
    .min(1, "Isi pesan wajib diisi")
    .max(4096, "Isi pesan tidak boleh lebih dari 4096 karakter"),
});

export type SendWhatsAppMessageInput = z.infer<typeof SendWhatsAppMessageSchema>;
