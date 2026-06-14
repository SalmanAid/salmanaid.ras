import { unstable_cache, revalidatePath, revalidateTag } from "next/cache";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import {
  CmsDocumentKeySchema,
  PublicLandingContentSchema,
  RoleShellContentSchema,
  type CmsDocumentKeyValue,
  type PublicLandingContent,
  type RoleShellContent,
} from "@/schemas/cms.schema";
import {
  defaultBorrowerShell,
  defaultDonorShell,
  defaultLandingContent,
} from "@/cms/defaults";

type CmsContent = PublicLandingContent | RoleShellContent;

export class CmsConflictError extends Error {
  constructor() {
    super("CMS_DRAFT_VERSION_CONFLICT");
  }
}

const defaults: Record<CmsDocumentKeyValue, CmsContent> = {
  PUBLIC_LANDING: defaultLandingContent,
  BORROWER_SHELL: defaultBorrowerShell,
  DONOR_SHELL: defaultDonorShell,
};

function parseContent(key: CmsDocumentKeyValue, value: unknown): CmsContent {
  return key === "PUBLIC_LANDING"
    ? PublicLandingContentSchema.parse(value)
    : RoleShellContentSchema.parse(value);
}

function asJson(value: CmsContent): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

function asDraftJson(value: unknown): Prisma.InputJsonValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("CMS_DRAFT_SHAPE_INVALID");
  }
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function ensureDocument(key: CmsDocumentKeyValue) {
  const fallback = defaults[key];
  return prisma.cmsDocument.upsert({
    where: { key },
    create: {
      key,
      schemaVersion: 1,
      draftContent: asJson(fallback),
      publishedContent: asJson(fallback),
      draftVersion: 1,
      publishedVersion: 1,
    },
    update: {},
  });
}

const getCachedPublishedDocument = unstable_cache(
  async (key: CmsDocumentKeyValue) => {
    const startedAt = performance.now();
    try {
      const document = await prisma.cmsDocument.findUnique({ where: { key } });
      if (!document) return defaults[key];
      return parseContent(key, document.publishedContent);
    } finally {
      const durationMs = Math.round(performance.now() - startedAt);
      console.info(JSON.stringify({ event: "cms_read", key, durationMs }));
    }
  },
  ["cms-published-document"],
  { revalidate: false, tags: ["cms:published"] }
);

export const CmsService = {
  getDefault(key: CmsDocumentKeyValue) {
    return defaults[key];
  },

  async getPublished(keyInput: string): Promise<CmsContent> {
    const key = CmsDocumentKeySchema.parse(keyInput);
    if (process.env.CMS_LANDING_ENABLED === "false") return defaults[key];

    try {
      return await getCachedPublishedDocument(key);
    } catch (error) {
      console.error(JSON.stringify({
        event: "cms_fallback",
        key,
        message: error instanceof Error ? error.message : "unknown",
      }));
      return defaults[key];
    }
  },

  async getAdminDocument(keyInput: string) {
    const key = CmsDocumentKeySchema.parse(keyInput);
    const document = await ensureDocument(key);
    return {
      key,
      draftVersion: document.draftVersion,
      publishedVersion: document.publishedVersion,
      draftContent: document.draftContent as unknown as CmsContent,
      publishedContent: parseContent(key, document.publishedContent),
      publishedAt: document.publishedAt,
      updatedAt: document.updatedAt,
    };
  },

  async saveDraft(input: {
    key: string;
    content: unknown;
    expectedDraftVersion: number;
    adminId: string;
  }) {
    const key = CmsDocumentKeySchema.parse(input.key);
    const content = asDraftJson(input.content);
    const document = await ensureDocument(key);
    if (document.draftVersion !== input.expectedDraftVersion) throw new CmsConflictError();

    const updated = await prisma.cmsDocument.updateMany({
      where: { id: document.id, draftVersion: input.expectedDraftVersion },
      data: {
        draftContent: content,
        draftVersion: { increment: 1 },
        editedBy: input.adminId,
      },
    });
    if (updated.count !== 1) throw new CmsConflictError();

    return this.getAdminDocument(key);
  },

  async publish(input: {
    key: string;
    expectedDraftVersion: number;
    adminId: string;
    changeNote?: string;
  }) {
    const key = CmsDocumentKeySchema.parse(input.key);
    const document = await ensureDocument(key);
    if (document.draftVersion !== input.expectedDraftVersion) throw new CmsConflictError();
    const content = parseContent(key, document.draftContent);
    const nextVersion = document.publishedVersion + 1;

    await prisma.$transaction(async (tx) => {
      const updated = await tx.cmsDocument.updateMany({
        where: { id: document.id, draftVersion: input.expectedDraftVersion },
        data: {
          publishedContent: asJson(content),
          publishedVersion: nextVersion,
          publishedBy: input.adminId,
          publishedAt: new Date(),
        },
      });
      if (updated.count !== 1) throw new CmsConflictError();

      await tx.cmsRevision.create({
        data: {
          documentId: document.id,
          version: nextVersion,
          content: asJson(content),
          changeNote: input.changeNote || null,
          createdBy: input.adminId,
        },
      });
    });

    revalidateTag("cms:published");
    revalidatePath("/");
    return this.getAdminDocument(key);
  },

  async listRevisions(keyInput: string) {
    const key = CmsDocumentKeySchema.parse(keyInput);
    const document = await ensureDocument(key);
    return prisma.cmsRevision.findMany({
      where: { documentId: document.id },
      select: {
        id: true,
        version: true,
        changeNote: true,
        createdBy: true,
        createdAt: true,
      },
      orderBy: { version: "desc" },
      take: 50,
    });
  },

  async restoreRevision(input: {
    key: string;
    revisionId: string;
    adminId: string;
    changeNote?: string;
  }) {
    const key = CmsDocumentKeySchema.parse(input.key);
    const document = await ensureDocument(key);
    const revision = await prisma.cmsRevision.findFirst({
      where: { id: input.revisionId, documentId: document.id },
    });
    if (!revision) throw new Error("CMS_REVISION_NOT_FOUND");

    const content = parseContent(key, revision.content);
    const nextVersion = document.publishedVersion + 1;
    await prisma.$transaction([
      prisma.cmsDocument.update({
        where: { id: document.id },
        data: {
          draftContent: asJson(content),
          publishedContent: asJson(content),
          draftVersion: { increment: 1 },
          publishedVersion: nextVersion,
          editedBy: input.adminId,
          publishedBy: input.adminId,
          publishedAt: new Date(),
        },
      }),
      prisma.cmsRevision.create({
        data: {
          documentId: document.id,
          version: nextVersion,
          content: asJson(content),
          changeNote: input.changeNote || `Restore revision ${revision.version}`,
          createdBy: input.adminId,
        },
      }),
    ]);

    revalidateTag("cms:published");
    revalidatePath("/");
    return this.getAdminDocument(key);
  },
};

export async function getPublishedLanding(): Promise<PublicLandingContent> {
  return CmsService.getPublished("PUBLIC_LANDING") as Promise<PublicLandingContent>;
}

export async function getPublishedRoleShell(
  role: "BORROWER" | "DONOR"
): Promise<RoleShellContent> {
  return CmsService.getPublished(role === "BORROWER" ? "BORROWER_SHELL" : "DONOR_SHELL") as Promise<RoleShellContent>;
}
