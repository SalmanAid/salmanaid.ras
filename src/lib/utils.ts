import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const idrNumberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
})

export function parseCurrencyInput(value: string | number | null | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "")
  return digits ? Number(digits) : 0
}

export function formatCurrency(amount: string | number | null | undefined) {
  const numericAmount = Number(amount)
  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0

  return `Rp${idrNumberFormatter.format(Math.round(safeAmount))}`
}

export function formatCurrencyInput(value: string | number | null | undefined) {
  const amount = parseCurrencyInput(value)
  return amount > 0 ? formatCurrency(amount) : ""
}

// implement other utilities needed here...
