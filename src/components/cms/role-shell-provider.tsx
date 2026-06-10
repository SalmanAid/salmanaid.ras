"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { RoleShellContent } from "@/schemas/cms.schema";
import { defaultBorrowerShell, defaultDonorShell } from "@/cms/defaults";

const RoleShellContext = createContext<RoleShellContent | null>(null);

export function RoleShellProvider({
  value,
  children,
}: {
  value: RoleShellContent;
  children: ReactNode;
}) {
  return <RoleShellContext.Provider value={value}>{children}</RoleShellContext.Provider>;
}

export function useRoleShell(role: "BORROWER" | "DONOR") {
  return useContext(RoleShellContext) || (role === "BORROWER" ? defaultBorrowerShell : defaultDonorShell);
}
