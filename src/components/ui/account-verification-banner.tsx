"use client";

import { ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

type VerifiableRole = "DONOR" | "BORROWER";

type UserRoleOverview = {
  role: string;
  verificationStatus: string;
  verificationMessage?: string | null;
};

const ROLE_LABELS: Record<VerifiableRole, string> = {
  DONOR: "Donatur",
  BORROWER: "Peminjam",
};

function getBannerMessage(role: UserRoleOverview) {
  if (role.verificationStatus === "REVISION_REQUESTED") {
    return role.verificationMessage || "Admin meminta perbaikan dokumen. Perbarui dokumen agar akun dapat ditinjau ulang.";
  }

  if (role.verificationStatus === "REJECTED") {
    return role.verificationMessage || "Verifikasi akun ditolak. Perbarui dokumen atau hubungi admin untuk bantuan.";
  }

  return "Akun Belum Terverifikasi, Tunggu Hingga Admin Melakukan Verifikasi.";
}

export default function AccountVerificationBanner({ role }: { role: VerifiableRole }) {
  const [userRole, setUserRole] = useState<UserRoleOverview | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRoleStatus = async () => {
      try {
        const response = await fetch("/api/user/me", { cache: "no-store" });
        if (!response.ok) return;

        const payload = await response.json();
        const matchedRole = (payload.data?.roles || []).find((item: UserRoleOverview) => item.role === role) || null;
        if (isMounted) setUserRole(matchedRole);
      } catch {
        if (isMounted) setUserRole(null);
      }
    };

    void fetchRoleStatus();

    return () => {
      isMounted = false;
    };
  }, [role]);

  if (!userRole || userRole.verificationStatus === "VERIFIED") return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-350 items-start gap-3 px-6 py-3 text-sm text-amber-900">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <span className="font-bold">Status {ROLE_LABELS[role]}: </span>
          <span className="font-semibold">{getBannerMessage(userRole)}</span>
        </div>
      </div>
    </div>
  );
}
