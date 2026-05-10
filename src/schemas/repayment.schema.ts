import { z } from "zod";

export const CreateRepaymentSchema = z.object({
  loanId: z.string().uuid({ message: "ID Pinjaman tidak valid" }),
  amount: z.number().positive({ message: "Jumlah harus lebih dari 0" }),
  paidAt: z.string().optional().transform((val) => (val ? new Date(val) : new Date())),
});