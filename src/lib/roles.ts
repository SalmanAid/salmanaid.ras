
export const ROLES = {
  ADMIN: "ADMIN",
  DONOR: "DONOR",
  BORROWER: "BORROWER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const LEGACY_ROLE_ALIASES: Record<string, Role> = {
  DONATUR: ROLES.DONOR,
  PEMINJAM: ROLES.BORROWER,
};

export function normalizeRoleName(role: string): string {
  return LEGACY_ROLE_ALIASES[role] || role;
}
