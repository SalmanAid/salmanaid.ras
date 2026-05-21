import { AccountVerificationStatus, Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { normalizeRoleName, ROLES } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";

const USER_DOCUMENT_BUCKET = process.env.SUPABASE_USER_BUCKET_NAME || "user-documents";

export type UserDocumentType = "identityCard" | "institutionCard" | "familyCard";
export type VerifiableRole = typeof ROLES.DONOR | typeof ROLES.BORROWER;

export const DOCUMENT_LABELS: Record<UserDocumentType, string> = {
  identityCard: "KTP",
  institutionCard: "Kartu Identitas Instansi",
  familyCard: "Kartu Keluarga",
};

export const ROLE_DOCUMENT_REQUIREMENTS: Record<VerifiableRole, UserDocumentType[]> = {
  [ROLES.DONOR]: ["identityCard"],
  [ROLES.BORROWER]: ["identityCard", "institutionCard", "familyCard"],
};

const ROLE_LABELS: Record<VerifiableRole, string> = {
  [ROLES.DONOR]: "Donatur",
  [ROLES.BORROWER]: "Peminjam",
};

type UserWithDocuments = {
  identityCard: string | null;
  identityCardUploadedAt: Date | null;
  institutionCard: string | null;
  institutionCardUploadedAt: Date | null;
  familyCard: string | null;
  familyCardUploadedAt: Date | null;
};

function isVerifiableRole(role: string): role is VerifiableRole {
  const normalizedRole = normalizeRoleName(role);
  return normalizedRole === ROLES.DONOR || normalizedRole === ROLES.BORROWER;
}

function getRoleLabel(role: string) {
  const normalizedRole = normalizeRoleName(role);
  return isVerifiableRole(normalizedRole) ? ROLE_LABELS[normalizedRole] : role;
}

function getDocumentUploadedAtKey(documentType: UserDocumentType) {
  return `${documentType}UploadedAt` as const;
}

async function createSignedDocumentUrl(storagePath: string | null) {
  if (!storagePath) return null;

  const { data, error } = await supabaseAdmin.storage
    .from(USER_DOCUMENT_BUCKET)
    .createSignedUrl(storagePath, 3600);

  if (error || !data?.signedUrl) {
    console.error("Supabase signed URL error:", error);
    return null;
  }

  return data.signedUrl;
}

async function buildDocumentSummaries(user: UserWithDocuments, role?: string) {
  const normalizedRole = role ? normalizeRoleName(role) : undefined;
  const documentTypes = normalizedRole && isVerifiableRole(normalizedRole)
    ? ROLE_DOCUMENT_REQUIREMENTS[normalizedRole]
    : (["identityCard", "institutionCard", "familyCard"] as UserDocumentType[]);

  return Promise.all(
    documentTypes.map(async (documentType) => {
      const storagePath = user[documentType];
      const uploadedAt = user[getDocumentUploadedAtKey(documentType)];

      return {
        type: documentType,
        label: DOCUMENT_LABELS[documentType],
        uploadedAt,
        signedUrl: await createSignedDocumentUrl(storagePath),
        isUploaded: Boolean(storagePath),
      };
    })
  );
}

export const AccountVerificationService = {
  isVerifiableRole,

  getRequiredDocuments(role: string) {
    const normalizedRole = normalizeRoleName(role);
    return isVerifiableRole(normalizedRole) ? ROLE_DOCUMENT_REQUIREMENTS[normalizedRole] : [];
  },

  getMissingDocuments(user: UserWithDocuments, role: string) {
    return this.getRequiredDocuments(role).filter((documentType) => !user[documentType]);
  },

  async getUserAccountOverview(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        address: true,
        identityCard: true,
        identityCardUploadedAt: true,
        institutionCard: true,
        institutionCardUploadedAt: true,
        familyCard: true,
        familyCardUploadedAt: true,
        roles: {
          include: {
            role: true,
          },
          orderBy: {
            verificationRequestedAt: "desc",
          },
        },
      },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const dedupedRoles = new Map<string, typeof user.roles[number]>();

    user.roles.forEach((userRole) => {
      const normalizedRole = normalizeRoleName(userRole.role.name);
      const currentRole = dedupedRoles.get(normalizedRole);

      if (!currentRole || currentRole.role.name !== normalizedRole) {
        dedupedRoles.set(normalizedRole, userRole);
      }
    });

    const roles = Array.from(dedupedRoles.entries()).map(([normalizedRole, userRole]) => {
      const missingDocuments = this.getMissingDocuments(user, normalizedRole);

      return {
        role: normalizedRole,
        label: getRoleLabel(normalizedRole),
        verificationStatus: userRole.verificationStatus,
        verificationMessage: userRole.verificationMessage,
        verificationRequestedAt: userRole.verificationRequestedAt,
        documentsUpdatedAt: userRole.documentsUpdatedAt,
        reviewedAt: userRole.reviewedAt,
        reviewedBy: userRole.reviewedBy,
        missingDocuments,
        missingDocumentLabels: missingDocuments.map((documentType) => DOCUMENT_LABELS[documentType]),
        isVerified: userRole.verificationStatus === AccountVerificationStatus.VERIFIED,
      };
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        address: user.address,
      },
      roles,
      documents: await buildDocumentSummaries(user),
    };
  },

  async getRoleVerification(userId: string, role: string) {
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        role: {
          name: role,
        },
      },
      include: {
        role: true,
      },
    });

    if (!userRole) {
      throw new Error("ROLE_NOT_FOUND");
    }

    return userRole;
  },

  async assertRoleVerified(userId: string, role: VerifiableRole) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        identityCard: true,
        identityCardUploadedAt: true,
        institutionCard: true,
        institutionCardUploadedAt: true,
        familyCard: true,
        familyCardUploadedAt: true,
        roles: {
          where: {
            role: {
              name: role,
            },
          },
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || user.roles.length === 0) {
      throw new Error("ROLE_NOT_FOUND");
    }

    const userRole = user.roles[0];
    const missingDocuments = this.getMissingDocuments(user, role);
    if (missingDocuments.length > 0) {
      throw new Error(`MISSING_DOCUMENTS:${missingDocuments.join(",")}`);
    }

    if (userRole.verificationStatus !== AccountVerificationStatus.VERIFIED) {
      throw new Error(`ACCOUNT_NOT_VERIFIED:${userRole.verificationStatus}`);
    }

    return userRole;
  },

  async addRoleToUser(input: {
    userId: string;
    role: VerifiableRole;
  }) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: {
        identityCard: true,
        identityCardUploadedAt: true,
        institutionCard: true,
        institutionCardUploadedAt: true,
        familyCard: true,
        familyCardUploadedAt: true,
      },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const missingDocuments = this.getMissingDocuments(user, input.role);
    if (missingDocuments.length > 0) {
      throw new Error(`MISSING_DOCUMENTS:${missingDocuments.join(",")}`);
    }

    const role = await prisma.role.upsert({
      where: { name: input.role },
      update: {},
      create: { name: input.role },
    });

    const existingUserRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: input.userId,
          roleId: role.id,
        },
      },
      include: {
        role: true,
      },
    });

    if (existingUserRole) {
      return existingUserRole;
    }

    return prisma.userRole.create({
      data: {
        userId: input.userId,
        roleId: role.id,
        verificationStatus: AccountVerificationStatus.PENDING,
        verificationRequestedAt: new Date(),
        documentsUpdatedAt: new Date(),
      },
      include: {
        role: true,
      },
    });
  },

  async markRolesPendingAfterDocumentUpdate(
    userId: string,
    documentType: UserDocumentType,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ) {
    const affectedRoles = documentType === "identityCard"
      ? [ROLES.DONOR, ROLES.BORROWER]
      : [ROLES.BORROWER];

    await tx.userRole.updateMany({
      where: {
        userId,
        role: {
          name: {
            in: affectedRoles,
          },
        },
      },
      data: {
        verificationStatus: AccountVerificationStatus.PENDING,
        verificationMessage: null,
        verificationRequestedAt: new Date(),
        documentsUpdatedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        isVerified: false,
        verificationDate: null,
        verifiedBy: null,
      },
    });
  },

  async listVerificationRequests(status?: AccountVerificationStatus) {
    const requests = await prisma.userRole.findMany({
      where: {
        role: {
          name: {
            in: [ROLES.DONOR, ROLES.BORROWER],
          },
        },
        ...(status ? { verificationStatus: status } : {}),
      },
      include: {
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone_number: true,
            address: true,
            identityCard: true,
            identityCardUploadedAt: true,
            institutionCard: true,
            institutionCardUploadedAt: true,
            familyCard: true,
            familyCardUploadedAt: true,
          },
        },
      },
      orderBy: [
        { documentsUpdatedAt: "desc" },
        { verificationRequestedAt: "desc" },
      ],
    });

    return Promise.all(
      requests.map(async (request) => {
        const documents = await buildDocumentSummaries(request.user, request.role.name);
        const missingDocuments = this.getMissingDocuments(request.user, request.role.name);
        const hasDocumentUpdate = Boolean(
          request.documentsUpdatedAt &&
          (!request.reviewedAt || request.documentsUpdatedAt > request.reviewedAt)
        );

        return {
          userId: request.userId,
          roleId: request.roleId,
          role: request.role.name,
          roleLabel: getRoleLabel(request.role.name),
          verificationStatus: request.verificationStatus,
          verificationMessage: request.verificationMessage,
          verificationRequestedAt: request.verificationRequestedAt,
          documentsUpdatedAt: request.documentsUpdatedAt,
          reviewedAt: request.reviewedAt,
          reviewedBy: request.reviewedBy,
          hasDocumentUpdate,
          missingDocuments,
          missingDocumentLabels: missingDocuments.map((documentType) => DOCUMENT_LABELS[documentType]),
          user: {
            id: request.user.id,
            name: request.user.name,
            email: request.user.email,
            phone_number: request.user.phone_number,
            address: request.user.address,
          },
          documents,
        };
      })
    );
  },

  async updateVerificationDecision(input: {
    userId: string;
    role: VerifiableRole;
    adminId: string;
    status: AccountVerificationStatus;
    message?: string | null;
  }) {
    const existingRole = await prisma.userRole.findFirst({
      where: {
        userId: input.userId,
        role: {
          name: input.role,
        },
      },
      include: {
        role: true,
        user: true,
      },
    });

    if (!existingRole) {
      throw new Error("ROLE_NOT_FOUND");
    }

    const missingDocuments = this.getMissingDocuments(existingRole.user, input.role);
    if (input.status === AccountVerificationStatus.VERIFIED && missingDocuments.length > 0) {
      throw new Error(`MISSING_DOCUMENTS:${missingDocuments.join(",")}`);
    }

    const updatedRole = await prisma.userRole.update({
      where: {
        userId_roleId: {
          userId: input.userId,
          roleId: existingRole.roleId,
        },
      },
      data: {
        verificationStatus: input.status,
        verificationMessage: input.status === AccountVerificationStatus.VERIFIED ? null : input.message || null,
        reviewedAt: new Date(),
        reviewedBy: input.adminId,
      },
      include: {
        role: true,
      },
    });

    const nonAdminRoles = await prisma.userRole.findMany({
      where: {
        userId: input.userId,
        role: {
          name: {
            not: ROLES.ADMIN,
          },
        },
      },
      select: {
        verificationStatus: true,
      },
    });

    const allNonAdminRolesVerified = nonAdminRoles.length > 0 &&
      nonAdminRoles.every((role) => role.verificationStatus === AccountVerificationStatus.VERIFIED);

    await prisma.user.update({
      where: { id: input.userId },
      data: {
        isVerified: allNonAdminRolesVerified,
        verificationDate: allNonAdminRolesVerified ? new Date() : null,
        verifiedBy: allNonAdminRolesVerified ? input.adminId : null,
      },
    });

    return updatedRole;
  },
};
