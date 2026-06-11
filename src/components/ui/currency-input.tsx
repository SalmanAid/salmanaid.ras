"use client"

import type { InputHTMLAttributes } from "react"

import { cn, formatCurrencyInput, parseCurrencyInput } from "@/lib/utils"

type CurrencyInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "type" | "value"
> & {
  value: string | number | null | undefined
  onValueChange: (value: number, rawDigits: string) => void
}

export function CurrencyInput({
  value,
  onValueChange,
  className,
  placeholder = "Rp0",
  ...props
}: CurrencyInputProps) {
  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={formatCurrencyInput(value)}
      placeholder={placeholder}
      onChange={(event) => {
        const rawDigits = event.target.value.replace(/\D/g, "")
        onValueChange(parseCurrencyInput(rawDigits), rawDigits)
      }}
      className={cn(className)}
    />
  )
}
