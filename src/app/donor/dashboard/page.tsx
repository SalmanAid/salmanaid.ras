"use client"

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import WalletLogo from "../../../../public/wallet.svg"
import GreenHeartLogo from "../../../../public/heart-green.svg"
import TrophyLogo from "../../../../public/trophy.svg"

import { useUserStore } from "@/hooks/userStore";
import DonorDashboard_SummaryOfDonor from "@/components/ui/donor-dashboard/summary_of_donor_block";
import DonorDashboard_StartNewDonation from "@/components/ui/donor-dashboard/start_new_donation_block";
import DonorDashboard_RecentDistributionTable from "@/components/ui/donor-dashboard/recent_distribution_table";
import DonorDashboard_DonorNavbar from "@/components/ui/donor-dashboard/donor_navbar";

type UserRoleOverview = {
  role: string;
  verificationStatus: string;
  verificationMessage?: string | null;
  missingDocumentLabels?: string[];
};

type DashboardSummary = {
  totalDonated: number;
  activeImpact: number;
  currentRank: string;
};

type DashboardDistribution = {
  id: string;
  date: string;
  programName: string;
  amount: number;
  status: "Pending" | "Distributed";
};

type DonorDashboardPayload = {
  summary: DashboardSummary;
  recentDistributions: DashboardDistribution[];
  quickSelectAmounts: number[];
};

const FALLBACK_DASHBOARD_DATA: DonorDashboardPayload = {
  summary: {
    totalDonated: 0,
    activeImpact: 0,
    currentRank: "Bronze Donor",
  },
  recentDistributions: [],
  quickSelectAmounts: [1000000, 5000000, 10000000],
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateIso: string) => {
  const date = new Date(dateIso);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function DonorDashboardPage(){
    const { data: session } = useSession();
    const username = useUserStore((state) => state.user?.username) || session?.user?.name || "Donor";
    const [dashboardData, setDashboardData] = useState<DonorDashboardPayload>(FALLBACK_DASHBOARD_DATA);
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingVerification, setIsCheckingVerification] = useState(true);
    const [donorRole, setDonorRole] = useState<UserRoleOverview | null>(null);

    useEffect(() => {
      let isMounted = true;

      const fetchAccountStatus = async () => {
        try {
          const response = await fetch("/api/user/me", { cache: "no-store" });
          if (!response.ok) {
            throw new Error("ACCOUNT_STATUS_FETCH_FAILED");
          }

          const payload = await response.json();
          const role = (payload.data?.roles || []).find((item: UserRoleOverview) => item.role === "DONOR") || null;
          if (isMounted) setDonorRole(role);
        } catch {
          if (isMounted) setDonorRole(null);
        } finally {
          if (isMounted) setIsCheckingVerification(false);
        }
      };

      void fetchAccountStatus();

      return () => {
        isMounted = false;
      };
    }, []);

    const isDonorVerified = donorRole?.verificationStatus === "VERIFIED";
    const missingDocuments = donorRole?.missingDocumentLabels || [];
    const verificationMessage = donorRole?.verificationMessage;

    const blockedMessage = !donorRole
      ? "Akun belum terdaftar sebagai Donatur. Daftar sebagai Donatur terlebih dahulu untuk mengakses dashboard."
      : donorRole.verificationStatus === "REVISION_REQUESTED"
        ? verificationMessage || "Admin meminta perbaikan dokumen. Perbarui dokumen yang diminta agar akun dapat ditinjau ulang."
        : donorRole.verificationStatus === "REJECTED"
          ? verificationMessage || "Verifikasi akun Donatur ditolak. Perbarui data atau hubungi admin untuk bantuan."
          : missingDocuments.length > 0
            ? `Dokumen Donatur belum lengkap: ${missingDocuments.join(", ")}.`
            : "Akun Belum Terverifikasi, Tunggu Hingga Admin Melakukan Verifikasi.";

    useEffect(() => {
      const fetchDashboardData = async () => {
        try {
          const response = await fetch("/api/donations?view=dashboard", {
            method: "GET",
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error("Failed to fetch donor dashboard data");
          }

          const payload = await response.json();
          setDashboardData(payload.data || FALLBACK_DASHBOARD_DATA);
        } catch (error) {
          console.error("Error loading donor dashboard data:", error);
          setDashboardData(FALLBACK_DASHBOARD_DATA);
        } finally {
          setIsLoading(false);
        }
      };

      fetchDashboardData();
    }, []);

    const tableRows = useMemo(
      () =>
        dashboardData.recentDistributions.map((distribution) => ({
          id: distribution.id,
          date: formatDate(distribution.date),
          programName: distribution.programName,
          amount: formatCurrency(distribution.amount),
          status: distribution.status,
        })),
      [dashboardData.recentDistributions]
    );

    return (
      <div className="bg-[#F3F5F7] text-[#111827]">
        <DonorDashboard_DonorNavbar />

        <main className="w-full max-w-350 mx-auto px-6 pb-10 pt-8">
          {isCheckingVerification && (
            <div className="rounded-lg border border-[#E2E8F0] bg-white p-8 text-sm font-semibold text-[#667085] shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
              Memeriksa status verifikasi akun...
            </div>
          )}

          {!isCheckingVerification && !isDonorVerified && (
            <div className="rounded-lg border border-amber-200 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <ShieldAlert size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-extrabold text-slate-900">Akun Donatur Belum Terverifikasi</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{blockedMessage}</p>
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={donorRole ? "/profile?from=DONOR" : "/account/roles?role=DONOR&from=DONOR"}
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-[#07B0C8] px-4 text-sm font-bold text-white transition hover:bg-[#069CB1]"
                    >
                      {donorRole ? "Perbarui Dokumen" : "Daftar sebagai Donatur"}
                    </Link>
                    <Link
                      href="/"
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-gray-50"
                    >
                      Kembali ke Beranda
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isCheckingVerification && isDonorVerified && (
          <>
          <section>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
              Welcome back, <span className="text-[#07B0C8]">{username}</span>
            </h1>
            <p className="mt-1.5 text-sm text-[#6B7280]">
              Your generosity is changing lives - thank you for making a difference
            </p>
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            <DonorDashboard_SummaryOfDonor
              logo={WalletLogo}
              alt="Wallet"
              title="Total Donated"
              caption={formatCurrency(dashboardData.summary.totalDonated)}
              color="07B0C8"
            />
            <DonorDashboard_SummaryOfDonor
              logo={GreenHeartLogo}
              alt="Green heart"
              title="Active Impact"
              caption={`${dashboardData.summary.activeImpact} Students`}
              color="10B981"
            />
            <DonorDashboard_SummaryOfDonor
              logo={TrophyLogo}
              alt="Trophy"
              title="Current Rank"
              caption={dashboardData.summary.currentRank}
              color="FCB82E"
            />
          </section>

          <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_460px]">
            <DonorDashboard_RecentDistributionTable rows={tableRows} isLoading={isLoading} />
            <DonorDashboard_StartNewDonation quickSelectAmounts={dashboardData.quickSelectAmounts} />
          </section>
          </>
          )}
        </main>
      </div>
    );
}