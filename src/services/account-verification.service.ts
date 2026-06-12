import { AccountVerificationStatus, Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { normalizeRoleName, ROLES } from "@/lib/roles";
import { batchGenerateSignedUrls } from "@/lib/supabase-batch";

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

const IDENTITY_FIELD_LABELS = {
  nik: "NIK",
  phone_number: "No. telepon",
  address: "Alamat",
} as const;

const ROLE_LABELS: Record<VerifiableRole, string> = {
  [ROLES.DONOR]: "Donatur",
  [ROLES.BORROWER]: "Peminjam",
};

type UserWithDocuments = {
  nik: string | null;
  phone_number: string | null;
  address: string | null;
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

async function buildDocumentSummaries(user: UserWithDocuments, role?: string) {
  const normalizedRole = role ? normalizeRoleName(role) : undefined;
  const documentTypes = normalizedRole && isVerifiableRole(normalizedRole)
    ? ROLE_DOCUMENT_REQUIREMENTS[normalizedRole]
    : (["identityCard", "institutionCard", "familyCard"] as UserDocumentType[]);

  // Collect all paths first for batch processing
  const paths = documentTypes
    .map((documentType) => user[documentType])
    .filter(Boolean) as string[];

  // Batch generate all signed URLs at once
  const signedUrlMap = paths.length > 0 
    ? await batchGenerateSignedUrls(paths)
    : new Map<string, string>();

  return documentTypes.map((documentType) => {
    const storagePath = user[documentType];
    const uploadedAt = user[getDocumentUploadedAtKey(documentType)];

    return {
      type: documentType,
      label: DOCUMENT_LABELS[documentType],
      uploadedAt,
      signedUrl: storagePath ? signedUrlMap.get(storagePath) || null : null,
      isUploaded: Boolean(storagePath),
    };
  });
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

  getMissingIdentityFields(user: Pick<UserWithDocuments, "nik" | "phone_number" | "address">) {
    return (Object.keys(IDENTITY_FIELD_LABELS) as (keyof typeof IDENTITY_FIELD_LABELS)[])
      .filter((field) => !user[field]?.trim());
  },

  async getUserAccountOverview(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        nik: true,
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
      const missingIdentityFields = this.getMissingIdentityFields(user);

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
        missingIdentityFields,
        missingIdentityLabels: missingIdentityFields.map((field) => IDENTITY_FIELD_LABELS[field]),
        isVerified: userRole.verificationStatus === AccountVerificationStatus.VERIFIED,
      };
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        nik: user.nik,
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
        nik: true,
        phone_number: true,
        address: true,
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

    const missingIdentityFields = this.getMissingIdentityFields(user);
    if (missingIdentityFields.length > 0) {
      throw new Error(`MISSING_IDENTITY:${missingIdentityFields.join(",")}`);
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
        nik: true,
        phone_number: true,
        address: true,
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

    const missingIdentityFields = this.getMissingIdentityFields(user);
    if (missingIdentityFields.length > 0) {
      throw new Error(`MISSING_IDENTITY:${missingIdentityFields.join(",")}`);
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

  async markRolesPendingAfterIdentityUpdate(userId: string, tx: Prisma.TransactionClient | typeof prisma = prisma) {
    await tx.userRole.updateMany({
      where: {
        userId,
        role: {
          name: {
            in: [ROLES.DONOR, ROLES.BORROWER],
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

  async listVerificationRequests(status?: AccountVerificationStatus, search?: string) {
    const query = search?.trim();
    const normalizedQuery = query?.toUpperCase();
    const matchingRoles = query
      ? [
          ...(["DONOR", "DONATUR"].some((label) => label.includes(normalizedQuery || "")) ? [ROLES.DONOR] : []),
          ...(["BORROWER", "PEMINJAM"].some((label) => label.includes(normalizedQuery || "")) ? [ROLES.BORROWER] : []),
        ]
      : [];
    const matchingStatuses = query
      ? Object.values(AccountVerificationStatus).filter((item) => item.includes(normalizedQuery || ""))
      : [];

    const requests = await prisma.userRole.findMany({
      where: {
        role: {
          name: {
            in: [ROLES.DONOR, ROLES.BORROWER],
          },
        },
        ...(status ? { verificationStatus: status } : {}),
        ...(query
          ? {
              AND: [
                {
                  OR: [
                    {
                      user: {
                        is: {
                          OR: [
                            { name: { contains: query, mode: "insensitive" } },
                            { email: { contains: query, mode: "insensitive" } },
                            { nik: { contains: query, mode: "insensitive" } },
                            { phone_number: { contains: query, mode: "insensitive" } },
                            { address: { contains: query, mode: "insensitive" } },
                            { identityCard: { contains: query, mode: "insensitive" } },
                            { institutionCard: { contains: query, mode: "insensitive" } },
                            { familyCard: { contains: query, mode: "insensitive" } },
                          ],
                        },
                      },
                    },
                    { verificationMessage: { contains: query, mode: "insensitive" } },
                    ...(matchingRoles.length > 0 ? [{ role: { name: { in: matchingRoles } } }] : []),
                    ...(matchingStatuses.length > 0
                      ? [{ verificationStatus: { in: matchingStatuses } }]
                      : []),
                  ],
                },
              ],
            }
          : {}),
      },
      include: {
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            nik: true,
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

    /**
     * OPTIMIZED: Batch all document URL signing
     * BEFORE: 30+ Supabase API calls (1 per document per user)
     * AFTER: 1-3 API calls (batch all unique paths first)
     */
    // Collect all unique document paths from all users
    const allDocumentPaths = new Set<string>();
    for (const request of requests) {
      const documentPaths = [
        request.user.identityCard,
        request.user.institutionCard,
        request.user.familyCard,
      ].filter(Boolean) as string[];
      
      documentPaths.forEach((path) => allDocumentPaths.add(path));
    }

    // Batch generate all signed URLs at once
    const signedUrlMap = allDocumentPaths.size > 0
      ? await batchGenerateSignedUrls(Array.from(allDocumentPaths))
      : new Map<string, string>();

    // Build response with signed URLs
    return requests.map((request) => {
      // Build documents using already-signed URLs (no await needed)
      const documentTypes = isVerifiableRole(request.role.name)
        ? ROLE_DOCUMENT_REQUIREMENTS[request.role.name]
        : (["identityCard", "institutionCard", "familyCard"] as UserDocumentType[]);

      const documents = documentTypes.map((documentType) => {
        const storagePath = request.user[documentType];
        const uploadedAt = request.user[getDocumentUploadedAtKey(documentType)];

        return {
          type: documentType,
          label: DOCUMENT_LABELS[documentType],
          uploadedAt,
          signedUrl: storagePath ? signedUrlMap.get(storagePath) || null : null,
          isUploaded: Boolean(storagePath),
        };
      });

      const missingDocuments = this.getMissingDocuments(request.user, request.role.name);
      const missingIdentityFields = this.getMissingIdentityFields(request.user);
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
        missingIdentityFields,
        missingIdentityLabels: missingIdentityFields.map((field) => IDENTITY_FIELD_LABELS[field]),
        user: {
          id: request.user.id,
          name: request.user.name,
          email: request.user.email,
          nik: request.user.nik,
          phone_number: request.user.phone_number,
          address: request.user.address,
        },
        documents,
      };
    });
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

    const missingIdentityFields = this.getMissingIdentityFields(existingRole.user);
    if (input.status === AccountVerificationStatus.VERIFIED && missingIdentityFields.length > 0) {
      throw new Error(`MISSING_IDENTITY:${missingIdentityFields.join(",")}`);
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
