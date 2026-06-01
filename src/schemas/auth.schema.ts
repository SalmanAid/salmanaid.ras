import { z } from "zod";

const passwordValidation = z.string()
  .min(8, "Password minimal 8 karakter")
  .regex(/[A-Z]/, "Password harus mengandung minimal 1 huruf besar (A-Z)")
  .regex(/[a-z]/, "Password harus mengandung minimal 1 huruf kecil (a-z)")
  .regex(/\d/, "Password harus mengandung minimal 1 angka (0-9)")
  .regex(/[!@#$%^&*()_+\-=\[\]{}|;:'",.<>?/]/, "Password harus mengandung minimal 1 karakter spesial (!@#$%^&*()_+-=[]{}|;:'\",.<>?/)");

export const RegisterSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter").optional(),
  email: z.string().email("Format email tidak valid"),
  password: passwordValidation,
  nik: z.string().trim().regex(/^\d{16}$/, "NIK harus terdiri dari 16 digit angka").optional(),
  phone_number: z.string()
    .trim()
    .min(8, "No. telepon minimal 8 karakter")
    .max(30, "No. telepon maksimal 30 karakter")
    .regex(/^\+?[0-9\s-]+$/, "No. telepon hanya boleh berisi angka, spasi, tanda +, atau tanda -")
    .optional(),
  address: z.string().trim().min(10, "Alamat minimal 10 karakter").max(500, "Alamat maksimal 500 karakter").optional(),
  role: z.enum(["DONOR", "BORROWER"]).optional(),
});

export const VerifySchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
  password: passwordValidation,
  confirmPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type VerifyInput = z.infer<typeof VerifySchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
