import { beforeEach, describe, expect, it, vi } from "vitest"

import { prisma } from "@/lib/prisma"
import { AccountVerificationService } from "@/services/account-verification.service"
import { LoanService } from "@/services/loan.service"

describe("admin deep search", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("adds the search term to loan application queries", async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0] as never)

    await LoanService.getLoanApplication(0, 10, undefined, "Budi")

    const query = vi.mocked(prisma.loanApplication.findMany).mock.calls[0][0]!
    expect(JSON.stringify(query.where)).toContain("Budi")
    expect(prisma.loanApplication.count).toHaveBeenCalledWith({
      where: query.where,
    })
  })

  it("adds the search term to loan monitoring queries", async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0] as never)

    await LoanService.getAllLoans(0, 10, undefined, "Rp1.000.000")

    const query = vi.mocked(prisma.loan.findMany).mock.calls[0][0]!
    expect(JSON.stringify(query.where)).toContain("1000000")
    expect(prisma.loan.count).toHaveBeenCalledWith({
      where: query.where,
    })
  })

  it("searches account identity and role information", async () => {
    vi.mocked(prisma.userRole.findMany).mockResolvedValue([])

    await AccountVerificationService.listVerificationRequests(undefined, "peminjam")

    const query = vi.mocked(prisma.userRole.findMany).mock.calls[0][0]!
    expect(JSON.stringify(query.where)).toContain("peminjam")
    expect(JSON.stringify(query.where)).toContain("BORROWER")
  })
})
