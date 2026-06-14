import type { ReactNode } from "react";
import { RoleShellProvider } from "@/components/cms/role-shell-provider";
import { RoleFooter } from "@/components/cms/role-footer";
import { getPublishedRoleShell } from "@/services/cms.service";

export default async function DonorLayout({ children }: { children: ReactNode }) {
  const shell = await getPublishedRoleShell("DONOR");
  return (
    <RoleShellProvider value={shell}>
      <div className="flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        <RoleFooter config={shell} />
      </div>
    </RoleShellProvider>
  );
}
