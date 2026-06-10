import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { assertAdmin, getAdminDocument, saveDraft } = vi.hoisted(() => ({
  assertAdmin: vi.fn(),
  getAdminDocument: vi.fn(),
  saveDraft: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({ assertAdmin }));
vi.mock("@/services/cms.service", () => ({
  CmsConflictError: class CmsConflictError extends Error {},
  CmsService: { getAdminDocument, saveDraft },
}));

import { GET, PATCH } from "@/app/api/admin/cms/[key]/route";

const context = { params: Promise.resolve({ key: "PUBLIC_LANDING" }) };

describe("admin CMS document route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertAdmin.mockResolvedValue({ ok: true, adminId: "admin-id" });
  });

  it("returns the admin document", async () => {
    getAdminDocument.mockResolvedValue({ key: "PUBLIC_LANDING", draftVersion: 1 });
    const response = await GET(new NextRequest("http://localhost/api/admin/cms/PUBLIC_LANDING"), context);
    expect(response.status).toBe(200);
    expect((await response.json()).data.key).toBe("PUBLIC_LANDING");
  });

  it("rejects malformed draft payload", async () => {
    const request = new NextRequest("http://localhost/api/admin/cms/PUBLIC_LANDING", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expectedDraftVersion: 0 }),
    });
    const response = await PATCH(request, context);
    expect(response.status).toBe(400);
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it("honors authorization failures", async () => {
    assertAdmin.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    });
    const response = await GET(new NextRequest("http://localhost/api/admin/cms/PUBLIC_LANDING"), context);
    expect(response.status).toBe(403);
  });
});
