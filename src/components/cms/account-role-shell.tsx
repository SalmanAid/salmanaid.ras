import type { ReactNode } from "react";
import { auth } from "@/auth";
import { RoleShellProvider } from "@/components/cms/role-shell-provider";
import { RoleFooter } from "@/components/cms/role-footer";
import { getPublishedRoleShell } from "@/services/cms.service";

export async function AccountRoleShell({ children }: { children: ReactNode }) {
  const session = await auth();
  const roles = ((session?.user as { roles?: string[] } | undefined)?.roles || []);
  const role = roles.includes("DONOR") ? "DONOR" : "BORROWER";
  const shell = await getPublishedRoleShell(role);

  return (
    <RoleShellProvider value={shell}>
      <div className="flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        <RoleFooter config={shell} />
      </div>
    </RoleShellProvider>
  );
}
