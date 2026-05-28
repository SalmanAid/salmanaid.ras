import { z } from "zod";

export const LoanApplicationSchema = z.object({
  installmentFreq : z.number().min(3, "Periode cicilan minimal 3 bulan").max(6, "Periode cicilan maximum 6 bulan"),
  requestedAmount: z.number().positive("Nominal pinjaman harus lebih dari 0"),
  description: z.string().min(10, "Deskripsi keperluan pinjaman minimal 10 karakter"),
  collateralUrl: z.string(),
  collateralDescription: z.string()
});

export type LoanApplicationInput = z.infer<typeof LoanApplicationSchema>;