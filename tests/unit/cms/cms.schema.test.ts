import { describe, expect, it } from "vitest";
import {
  PublicLandingContentSchema,
  RoleShellContentSchema,
  richTextFromPlainText,
  richTextToPlainText,
} from "@/schemas/cms.schema";
import {
  defaultBorrowerShell,
  defaultDonorShell,
  defaultLandingContent,
} from "@/cms/defaults";

describe("CMS content schemas", () => {
  it("accepts every default document", () => {
    expect(PublicLandingContentSchema.safeParse(defaultLandingContent).success).toBe(true);
    expect(RoleShellContentSchema.safeParse(defaultBorrowerShell).success).toBe(true);
    expect(RoleShellContentSchema.safeParse(defaultDonorShell).success).toBe(true);
  });

  it("rejects unsafe links", () => {
    const content = structuredClone(defaultLandingContent);
    const hero = content.sections.find((section) => section.type === "hero");
    if (!hero || hero.type !== "hero") throw new Error("Hero missing");
    hero.cards[0].button.href = "javascript:alert(1)";
    expect(PublicLandingContentSchema.safeParse(content).success).toBe(false);
  });

  it("rejects duplicate IDs across repeatable content", () => {
    const content = structuredClone(defaultLandingContent);
    content.navbar.items[1].id = content.navbar.items[0].id;
    expect(PublicLandingContentSchema.safeParse(content).success).toBe(false);
  });

  it("keeps hero first and call to action last", () => {
    const content = structuredClone(defaultLandingContent);
    [content.sections[0], content.sections[1]] = [content.sections[1], content.sections[0]];
    expect(PublicLandingContentSchema.safeParse(content).success).toBe(false);
  });

  it("converts plain text to safe rich text and back", () => {
    const source = "Paragraf pertama.\n\nParagraf kedua.";
    expect(richTextToPlainText(richTextFromPlainText(source))).toBe(source);
  });
});
