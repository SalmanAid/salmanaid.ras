import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { CurrencyInput } from "@/components/ui/currency-input"

describe("CurrencyInput", () => {
  it("shows a formatted Rupiah value", () => {
    render(<CurrencyInput aria-label="Nominal" value={1000000} onValueChange={vi.fn()} />)

    expect((screen.getByLabelText("Nominal") as HTMLInputElement).value).toBe("Rp1.000.000")
  })

  it("returns the numeric value while the user types", () => {
    const onValueChange = vi.fn()
    render(<CurrencyInput aria-label="Nominal" value="" onValueChange={onValueChange} />)

    fireEvent.change(screen.getByLabelText("Nominal"), {
      target: { value: "Rp1.250.000" },
    })

    expect(onValueChange).toHaveBeenCalledWith(1250000, "1250000")
  })
})
