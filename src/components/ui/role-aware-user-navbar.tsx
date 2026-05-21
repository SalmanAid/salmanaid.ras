"use client";

import { useSession } from "next-auth/react";

import ApplicantDashboard_ApplicantNavbar from "@/components/ui/applicant-dashboard/applicant_navbar";
import DonorDashboard_DonorNavbar from "@/components/ui/donor-dashboard/donor_navbar";

type NavbarRole = "DONOR" | "BORROWER";

function getRoleFromUrl(): NavbarRole | null {
  if (typeof window === "undefined") return null;

  const from = new URLSearchParams(window.location.search).get("from");
  if (from === "DONOR" || from === "BORROWER") return from;

  return null;
}

export default function RoleAwareUserNavbar() {
  const { data: session } = useSession();
  const roles = ((session?.user as { roles?: string[] } | undefined)?.roles || []) as string[];

  const roleFromUrl = getRoleFromUrl();
  const activeRole: NavbarRole = roleFromUrl || (roles.includes("DONOR") ? "DONOR" : "BORROWER");

  if (activeRole === "DONOR") {
    return <DonorDashboard_DonorNavbar />;
  }

  return <ApplicantDashboard_ApplicantNavbar />;
}
