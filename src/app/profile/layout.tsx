import type { ReactNode } from "react";
import { AccountRoleShell } from "@/components/cms/account-role-shell";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <AccountRoleShell>{children}</AccountRoleShell>;
}
