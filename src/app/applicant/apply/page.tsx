
"use client"

import ApplicantForm_PersonalInformationSection from "@/components/ui/applicant-form/personal_information_section";
import ApplicantForm_FinancialNeedsSection from "@/components/ui/applicant-form/financial_needs_section";
import ApplicantForm_TermsAndAgreementSection from "@/components/ui/applicant-form/terms_and_agreement_section";
import ApplicantForm_ApplicationProgressSection from "@/components/ui/applicant-form/application_progress_section";

import { useApplicationProgressStore } from "@/hooks/applicationProgressStore";
import ApplicantDashboard_ApplicantNavbar from "@/components/ui/applicant-dashboard/applicant_navbar";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

type UserRoleOverview = {
    role: string;
    verificationStatus: string;
    verificationMessage?: string | null;
    missingDocumentLabels?: string[];
};

export default function ApplyLoanFormPage(){

    const applicationProgress = useApplicationProgressStore((state) => (state.application_progress))
    const [isCheckingVerification, setIsCheckingVerification] = useState(true);
    const [borrowerRole, setBorrowerRole] = useState<UserRoleOverview | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchAccountStatus = async () => {
            try {
                const response = await fetch("/api/user/me", { cache: "no-store" });
                if (!response.ok) {
                    throw new Error("ACCOUNT_STATUS_FETCH_FAILED");
                }

                const payload = await response.json();
                const role = (payload.data?.roles || []).find((item: UserRoleOverview) => item.role === "BORROWER") || null;
                if (isMounted) setBorrowerRole(role);
            } catch {
                if (isMounted) setBorrowerRole(null);
            } finally {
                if (isMounted) setIsCheckingVerification(false);
            }
        };

        void fetchAccountStatus();

        return () => {
            isMounted = false;
        };
    }, []);

    const isBorrowerVerified = borrowerRole?.verificationStatus === "VERIFIED";
    const missingDocuments = borrowerRole?.missingDocumentLabels || [];
    const verificationMessage = borrowerRole?.verificationMessage;

    const blockedMessage = !borrowerRole
        ? "Akun belum terdaftar sebagai Peminjam. Daftar sebagai Peminjam terlebih dahulu untuk mengajukan pinjaman."
        : borrowerRole.verificationStatus === "REVISION_REQUESTED"
            ? verificationMessage || "Admin meminta perbaikan dokumen. Perbarui dokumen yang diminta agar akun dapat ditinjau ulang."
            : borrowerRole.verificationStatus === "REJECTED"
                ? verificationMessage || "Verifikasi akun Peminjam ditolak. Perbarui data atau hubungi admin untuk bantuan."
                : missingDocuments.length > 0
                    ? `Dokumen Peminjam belum lengkap: ${missingDocuments.join(", ")}.`
                    : "Akun Belum Terverifikasi, Tunggu Hingga Admin Melakukan Verifikasi.";

    return (
        <div className="min-h-screen w-full bg-[#F8FAFC] text-[#111827]">
            <ApplicantDashboard_ApplicantNavbar showNotifications={false} />

            <main className="mx-auto w-full max-w-[1100px] px-5 pb-16 pt-11 sm:px-6 lg:px-0">
                <header className="mb-7">
                    <h1 className="text-[28px] font-extrabold leading-tight tracking-normal text-[#111827] sm:text-[30px]">
                        Student Loan Application
                    </h1>
                    <p className="mt-3 text-sm font-medium text-[#667085]">
                        Complete all steps to submit your interest-free loan application
                    </p>
                </header>

                <div className={`grid items-start gap-7 ${isBorrowerVerified ? "lg:grid-cols-[304px_1fr]" : "lg:grid-cols-1"}`}>
                    {isBorrowerVerified && (
                        <aside className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
                            <div className="text-base font-bold text-[#111827]">
                                Application Progress
                            </div>
                            <ApplicantForm_ApplicationProgressSection />
                        </aside>
                    )}

                    <section className="min-w-0">
                        {isCheckingVerification && (
                            <div className="rounded-lg border border-[#E2E8F0] bg-white p-8 text-sm font-semibold text-[#667085] shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
                                Memeriksa status verifikasi akun...
                            </div>
                        )}

                        {!isCheckingVerification && !isBorrowerVerified && (
                            <div className="rounded-lg border border-amber-200 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                        <ShieldAlert size={22} />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-lg font-extrabold text-slate-900">Akun Peminjam Belum Terverifikasi</h2>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">{blockedMessage}</p>
                                        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                                            <Link
                                                href={borrowerRole ? "/profile?from=BORROWER" : "/account/roles?role=BORROWER&from=BORROWER"}
                                                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#07B0C8] px-4 text-sm font-bold text-white transition hover:bg-[#069CB1]"
                                            >
                                                {borrowerRole ? "Perbarui Dokumen" : "Daftar sebagai Peminjam"}
                                            </Link>
                                            <Link
                                                href="/applicant/dashboard"
                                                className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-gray-50"
                                            >
                                                Kembali ke Dashboard
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isCheckingVerification && isBorrowerVerified && applicationProgress?.step == 1 && <ApplicantForm_PersonalInformationSection /> }
                        {!isCheckingVerification && isBorrowerVerified && applicationProgress?.step == 2 && <ApplicantForm_FinancialNeedsSection /> }
                        {!isCheckingVerification && isBorrowerVerified && applicationProgress?.step == 3 && <ApplicantForm_TermsAndAgreementSection /> }
                    </section>
                </div>
            </main>
        </div>
    );
}
