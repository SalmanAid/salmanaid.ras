import { z } from "zod";

export const cmsDocumentKeys = [
  "PUBLIC_LANDING",
  "BORROWER_SHELL",
  "DONOR_SHELL",
] as const;

export const CmsDocumentKeySchema = z.enum(cmsDocumentKeys);
export type CmsDocumentKeyValue = z.infer<typeof CmsDocumentKeySchema>;

const SafeLinkSchema = z.string().trim().min(1).max(500).refine((value) => {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (value.startsWith("#")) return true;

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}, "Link harus berupa route internal, anchor, atau URL HTTPS");

const IconKeySchema = z.enum([
  "heart",
  "graduation-cap",
  "hand-coins",
  "dollar",
  "users",
  "percent",
  "shield",
  "file-text",
  "lock",
  "badge-check",
  "check",
]);

const RichTextMarkSchema = z.object({
  type: z.enum(["bold", "italic", "link"]),
  attrs: z.object({ href: SafeLinkSchema }).optional(),
});

const RichTextTextNodeSchema = z.object({
  type: z.literal("text"),
  text: z.string().max(5000),
  marks: z.array(RichTextMarkSchema).max(8).optional(),
});

type RichTextNode = {
  type: "paragraph" | "bulletList" | "orderedList" | "listItem";
  content?: Array<RichTextNode | z.infer<typeof RichTextTextNodeSchema>>;
};

const RichTextNodeSchema: z.ZodType<RichTextNode> = z.lazy(() =>
  z.object({
    type: z.enum(["paragraph", "bulletList", "orderedList", "listItem"]),
    content: z.array(z.union([RichTextNodeSchema, RichTextTextNodeSchema])).max(50).optional(),
  })
);

export const RichTextSchema = z.object({
  type: z.literal("doc"),
  content: z.array(RichTextNodeSchema).max(50).default([]),
});

export type RichText = z.infer<typeof RichTextSchema>;

export function richTextFromPlainText(value: string): RichText {
  return {
    type: "doc",
    content: value
      .split(/\n{2,}/)
      .map((text) => text.trim())
      .filter(Boolean)
      .map((text) => ({
        type: "paragraph" as const,
        content: [{ type: "text" as const, text }],
      })),
  };
}

export function richTextToPlainText(value: RichText): string {
  const collect = (node: RichTextNode | z.infer<typeof RichTextTextNodeSchema>): string => {
    if (node.type === "text") return node.text;
    return (node.content || []).map(collect).join(node.type === "listItem" ? " " : "\n");
  };

  return value.content.map(collect).join("\n\n");
}

const ImageSchema = z.object({
  url: z.string().trim().min(1).max(1000),
  alt: z.string().trim().min(1).max(180),
  focalX: z.number().int().min(0).max(100).default(50),
  focalY: z.number().int().min(0).max(100).default(50),
});

const LinkButtonSchema = z.object({
  id: z.string().uuid(),
  label: z.string().trim().min(1).max(60),
  href: SafeLinkSchema,
  icon: IconKeySchema.optional(),
  variant: z.enum(["primary", "secondary", "outline"]).default("primary"),
});

const SectionBaseSchema = z.object({
  id: z.string().min(1).max(80),
  enabled: z.boolean(),
});

const HeroSectionSchema = SectionBaseSchema.extend({
  type: z.literal("hero"),
  heading: z.string().trim().min(1).max(140),
  description: RichTextSchema,
  image: ImageSchema,
  overlay: z.enum(["cyan", "dark", "soft"]),
  cards: z.array(z.object({
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(80),
    description: z.string().trim().min(1).max(300),
    icon: IconKeySchema,
    button: LinkButtonSchema,
    theme: z.enum(["gold", "cyan", "green"]),
  })).min(1).max(3),
});

const HowItWorksSectionSchema = SectionBaseSchema.extend({
  type: z.literal("howItWorks"),
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500),
  steps: z.array(z.object({
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(80),
    description: z.string().trim().min(1).max(500),
    color: z.enum(["gold", "cyan", "teal", "green"]),
  })).min(2).max(6),
});

const ImpactStatsSectionSchema = SectionBaseSchema.extend({
  type: z.literal("impactStats"),
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500),
  cards: z.array(z.object({
    id: z.string().uuid(),
    metric: z.enum(["totalDonations", "totalDisbursed", "studentsHelped", "activeLoans", "manual"]),
    manualValue: z.string().max(40).optional(),
    label: z.string().trim().min(1).max(80),
    description: z.string().trim().min(1).max(300),
    icon: IconKeySchema,
    prefix: z.string().max(15).default(""),
    suffix: z.string().max(15).default(""),
    format: z.enum(["compact", "full", "plain"]).default("compact"),
  })).min(1).max(4),
});

const ProgramsSectionSchema = SectionBaseSchema.extend({
  type: z.literal("programs"),
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500),
  programs: z.array(z.object({
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(100),
    summary: z.string().trim().min(1).max(400),
    icon: IconKeySchema,
    detail: RichTextSchema,
    terms: z.array(z.string().trim().min(1).max(300)).max(12),
    buttonLabel: z.string().trim().min(1).max(60),
    href: SafeLinkSchema,
  })).min(1).max(6),
});

const TrustSectionSchema = SectionBaseSchema.extend({
  type: z.literal("trustTransparency"),
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500),
  features: z.array(z.object({
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(80),
    description: z.string().trim().min(1).max(300),
    icon: IconKeySchema,
  })).min(1).max(9),
  certifications: z.array(z.object({
    id: z.string().uuid(),
    label: z.string().trim().min(1).max(80),
  })).max(8),
});

const FaqSectionSchema = SectionBaseSchema.extend({
  type: z.literal("faq"),
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500),
  items: z.array(z.object({
    id: z.string().uuid(),
    question: z.string().trim().min(1).max(200),
    answer: RichTextSchema,
  })).min(1).max(20),
});

const CtaSectionSchema = SectionBaseSchema.extend({
  type: z.literal("callToAction"),
  title: z.string().trim().min(1).max(120),
  description: RichTextSchema,
  background: z.enum(["cyan", "navy", "green"]),
  buttons: z.array(LinkButtonSchema).min(1).max(2),
});

export const LandingSectionSchema = z.discriminatedUnion("type", [
  HeroSectionSchema,
  HowItWorksSectionSchema,
  ImpactStatsSectionSchema,
  ProgramsSectionSchema,
  TrustSectionSchema,
  FaqSectionSchema,
  CtaSectionSchema,
]);

const NavSchema = z.object({
  logoUrl: z.string().min(1).max(1000),
  logoAlt: z.string().min(1).max(180),
  items: z.array(z.object({
    id: z.string().uuid(),
    label: z.string().trim().min(1).max(50),
    sectionId: z.string().min(1).max(80),
  })).max(6),
  loginLabel: z.string().trim().min(1).max(40),
  registerLabel: z.string().trim().min(1).max(40),
});

const FooterLinkSchema = z.object({
  id: z.string().uuid(),
  label: z.string().trim().min(1).max(80),
  href: SafeLinkSchema,
});

const FooterSchema = z.object({
  logoUrl: z.string().min(1).max(1000),
  logoAlt: z.string().min(1).max(180),
  description: z.string().trim().min(1).max(500),
  groups: z.array(z.object({
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(80),
    links: z.array(FooterLinkSchema).max(8),
  })).min(1).max(4),
  contact: z.object({
    email: z.string().email(),
    phone: z.string().min(3).max(40),
    address: z.string().min(3).max(200),
  }),
  copyright: z.string().min(1).max(200),
  legalLinks: z.array(FooterLinkSchema).max(5),
});

function uniqueIds(value: unknown): boolean {
  const ids: string[] = [];
  const visit = (item: unknown) => {
    if (Array.isArray(item)) return item.forEach(visit);
    if (!item || typeof item !== "object") return;
    const record = item as Record<string, unknown>;
    if (typeof record.id === "string") ids.push(record.id);
    Object.values(record).forEach(visit);
  };
  visit(value);
  return ids.length === new Set(ids).size;
}

export const PublicLandingContentSchema = z.object({
  schemaVersion: z.literal(1),
  seo: z.object({
    title: z.string().trim().min(1).max(70),
    description: z.string().trim().min(1).max(170),
    ogImageUrl: z.string().min(1).max(1000),
  }),
  navbar: NavSchema,
  footer: FooterSchema,
  sections: z.array(LandingSectionSchema).length(7),
}).superRefine((value, context) => {
  if (!uniqueIds(value)) {
    context.addIssue({ code: "custom", message: "Semua ID konten harus unik" });
  }

  const sectionTypes = value.sections.map((section) => section.type);
  if (new Set(sectionTypes).size !== sectionTypes.length) {
    context.addIssue({ code: "custom", message: "Tipe section tidak boleh diduplikasi" });
  }
  if (value.sections[0]?.type !== "hero" || value.sections.at(-1)?.type !== "callToAction") {
    context.addIssue({ code: "custom", message: "Hero harus pertama dan CTA harus terakhir" });
  }

  const enabledIds = new Set(value.sections.filter((section) => section.enabled).map((section) => section.id));
  value.navbar.items.forEach((item, index) => {
    if (!enabledIds.has(item.sectionId)) {
      context.addIssue({
        code: "custom",
        message: "Menu mengarah ke section yang tidak aktif",
        path: ["navbar", "items", index, "sectionId"],
      });
    }
  });
});

const RoleMenuLabelsSchema = z.object({
  dashboard: z.string().trim().min(1).max(50),
  profile: z.string().trim().min(1).max(50),
  logout: z.string().trim().min(1).max(50),
  apply: z.string().trim().min(1).max(50).optional(),
  installment: z.string().trim().min(1).max(50).optional(),
  donate: z.string().trim().min(1).max(50).optional(),
});

export const RoleShellContentSchema = z.object({
  schemaVersion: z.literal(1),
  logoUrl: z.string().min(1).max(1000),
  logoAlt: z.string().min(1).max(180),
  menuLabels: RoleMenuLabelsSchema,
  helpText: z.string().trim().min(1).max(250),
  footer: z.object({
    helpLabel: z.string().trim().min(1).max(80),
    helpHref: SafeLinkSchema,
    contactLabel: z.string().trim().min(1).max(80),
    contactHref: SafeLinkSchema,
    privacyLabel: z.string().trim().min(1).max(80),
    privacyHref: SafeLinkSchema,
    copyright: z.string().trim().min(1).max(200),
  }),
});

export type PublicLandingContent = z.infer<typeof PublicLandingContentSchema>;
export type LandingSection = z.infer<typeof LandingSectionSchema>;
export type RoleShellContent = z.infer<typeof RoleShellContentSchema>;

export const DraftSaveSchema = z.object({
  expectedDraftVersion: z.number().int().positive(),
  content: z.unknown(),
});

export const PublishSchema = z.object({
  expectedDraftVersion: z.number().int().positive(),
  changeNote: z.string().trim().max(300).optional(),
});
