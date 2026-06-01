"use client";

import Link from "next/link";
import { useUserStore } from "@/hooks/userStore";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState, useMemo, Suspense } from "react";
import { CalendarDays, CreditCard, FileCheck2, ShieldAlert } from "lucide-react";
import ApplicantDashboard_PaymentScheduleRow from "@/components/ui/applicant-dashboard/payment_schedule_block";
import ApplicantDashboard_ApplicationProgressComponent from "@/components/ui/applicant-dashboard/application_progress_block";
import ApplicantDashboard_ApplicantNavbar from "@/components/ui/applicant-dashboard/applicant_navbar";
import ApplicantDashboard_PaymentApplicantComponent from "@/components/ui/applicant-dashboard/payment_applicant_modal";

type UserRoleOverview = {
    role: string;
    verificationStatus: string;
    verificationMessage?: string | null;
    missingDocumentLabels?: string[];
};

type LoanApplication = {
    id: string;
    requestedAmount: number;
    status: string;
    description: string;
    createdAt: string;
    dueDate?: string | null;
    // Harmonized naming support for both typing variations just in case
    installmentFreq?: number; 
    loanDetails?: {
        loanId: string;
        approvedAmount: number;
        status: string;
        dueDate: string;
        approvedAt?: string | null;
        totalPaid?: number;
    } | null;
};

type RepaymentHistoryItem = {
    id: string;
    loanId: string;
    applicationId: string | null;
    loanName: string | null;
    amount: number;
    paidAt: string;
    status: string;
    paymentTransactionId: string | null;
};

export default function ApplicantDashboardPage() {
    const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState<boolean>(false)
    const [activeTab, setActiveTab] = useState<"detail" | "riwayat">("detail");

    // REMOVED: const [installmentFreq, setInstallmentFreq] = useState<number>(4);
    const [applications, setApplications] = useState<LoanApplication[]>([]);
    const [selectedLoanId, setSelectedLoanId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string>("");
    const [repaymentTotalPaid, setRepaymentTotalPaid] = useState<number>(0);
    const [repaymentHistory, setRepaymentHistory] = useState<RepaymentHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string>("");
    const [isCheckingVerification, setIsCheckingVerification] = useState(true);
    const [borrowerRole, setBorrowerRole] = useState<UserRoleOverview | null>(null);

    const { data: session, status } = useSession();
    const username =
        useUserStore((state) => state.user?.username) ||
        session?.user?.name ||
        "Rayhan Farrukh";
    const userId =
        useUserStore((state) => state.user?.id) ||
        (session?.user as { id?: string } | null)?.id ||
        null;

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
        ? "Akun belum terdaftar sebagai Peminjam. Daftar sebagai Peminjam terlebih dahulu untuk mengakses dashboard."
        : borrowerRole.verificationStatus === "REVISION_REQUESTED"
            ? verificationMessage || "Admin meminta perbaikan dokumen. Perbarui dokumen yang diminta agar akun dapat ditinjau ulang."
            : borrowerRole.verificationStatus === "REJECTED"
                ? verificationMessage || "Verifikasi akun Peminjam ditolak. Perbarui data atau hubungi admin untuk bantuan."
                : missingDocuments.length > 0
                    ? `Dokumen Peminjam belum lengkap: ${missingDocuments.join(", ")}.`
                    : "Akun Belum Terverifikasi, Tunggu Hingga Admin Melakukan Verifikasi.";

    useEffect(() => {
        const fetchAllLoans = async () => {
            if (status === "loading") {
                return;
            }

            if (!userId) {
                setApplications([]);
                setFetchError("Gagal memuat data pinjaman karena ID pengguna tidak tersedia.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setFetchError("");
            try {
                const response = await fetch(`/api/loans/${userId}`);
                if (!response.ok) throw new Error("Gagal memuat data pinjaman");

                const result = await response.json();
                console.log(result)
                const apps = (result.data?.applications || []) as LoanApplication[];

                setApplications(apps);

                if (apps.length > 0) {
                    setSelectedLoanId(apps[0].id);
                } else {
                    setSelectedLoanId("");
                }
            } catch (error) {
                console.error("Fetch error:", error);
                setFetchError("Gagal memuat data pinjaman. Silakan coba lagi.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllLoans();
    }, [userId, status]);

    useEffect(() => {
        const fetchRepaymentHistory = async () => {
            if (status === "loading") {
                return;
            }

            setHistoryLoading(true);
            setHistoryError("");

            try {
                const response = await fetch("/api/repayments/me");
                if (!response.ok) {
                    throw new Error("Gagal memuat riwayat pembayaran");
                }

                const result = await response.json();
                setRepaymentHistory((result.data || []) as RepaymentHistoryItem[]);
            } catch (error) {
                console.error("Repayment history error:", error);
                setHistoryError("Gagal memuat riwayat pembayaran. Silakan coba lagi.");
            } finally {
                setHistoryLoading(false);
            }
        };

        fetchRepaymentHistory();
    }, [status]);

    const nearestDueDate = useMemo(() => {
        const activeDates = applications
            .filter(app => app.status === "APPROVED")
            .map(app => app.loanDetails?.dueDate || app.dueDate)
            .map((dueDate) => (dueDate ? new Date(dueDate).getTime() : null))
            .filter((date): date is number => date !== null);

        return activeDates.length > 0 ? new Date(Math.min(...activeDates)) : null;
    }, [applications]);

    const selectedLoan = useMemo(() => {
        return applications.find(app => app.id === selectedLoanId);
    }, [selectedLoanId, applications]);

    const selectedApplicationStatus = selectedLoan?.status || "";
    const selectedLoanDueDate = selectedLoan?.loanDetails?.dueDate || selectedLoan?.dueDate || null;
    const scheduleAvailable = Boolean(
        selectedLoan &&
        selectedLoan.loanDetails &&
        (selectedLoan.loanDetails.status === "ACTIVE" || selectedLoan.loanDetails.status === "PAID")
    );

    // 1. DYNAMIC CALCULATION: Extracted freq from specific active loan application payload item context directly
    const currentLoanFreq = useMemo(() => {
        if (!selectedLoan) {
            return 4
        };
        return selectedLoan.installmentFreq ?? 4;
    }, [selectedLoan]);

    const installmentValue = useMemo(() => {
        if (!selectedLoan) return 0;
        const amount = selectedLoan.loanDetails?.approvedAmount ?? selectedLoan.requestedAmount;
        return Number(amount) / currentLoanFreq;
    }, [selectedLoan, currentLoanFreq]);

    useEffect(() => {
        const fetchRepayments = async () => {
            const loanId = selectedLoan?.loanDetails?.loanId || selectedLoan?.id;

            if (!loanId || !selectedLoan?.loanDetails) {
                setRepaymentTotalPaid(0);
                return;
            }

            try {
                const response = await fetch(`/api/loans/${loanId}/repayments`);
                if (!response.ok) {
                    throw new Error("Failed to fetch repayments");
                }

                const result = await response.json();
                setRepaymentTotalPaid(Number(result?.data?.totalPaid || 0));
            } catch (error) {
                console.error("Repayment fetch error:", error);
                setRepaymentTotalPaid(0);
            }
        };

        fetchRepayments();
    }, [selectedLoan?.loanDetails, selectedLoan?.id]);

    const getInstallmentStatus = (date: Date, loanStatus?: string) => {
        if (loanStatus === "PAID") return "paid";

        const today = new Date();
        if (date.getTime() < today.getTime()) {
            return "past_due";
        }
        const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 7) {
            return "due_soon";
        }

        return "pending";
    };

    const formatIdr = (value: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(value);

    const formatStatus = (value: string | null | undefined) => {
        if (!value) return "-";
        const map: Record<string, string> = {
            APPROVED: "Disetujui",
            PENDING: "Menunggu",
            REJECTED: "Ditolak",
            ACTIVE: "Aktif",
            PAID: "Lunas",
            FORGIVEN: "Dihapuskan",
            DEFAULTED: "Gagal Bayar",
            CONFIRMED: "Terkonfirmasi",
        };
        return map[value] || value;
    };

    const repaymentStatusStyle = (value: string) => {
        const map: Record<string, { bg: string; text: string }> = {
            CONFIRMED: { bg: "#D0FAE5", text: "#006045" },
            PENDING: { bg: "#FEF9C2", text: "#894B00" },
        };

        return map[value] || { bg: "#E5E7EB", text: "#4B5563" };
    };

    const getLoanTotalPaid = useCallback((loan: LoanApplication) => {
        const totalFromLoanList = Number(loan.loanDetails?.totalPaid || 0);
        const approvedAmount = Number(loan.loanDetails?.approvedAmount || 0);
        const isSelectedLoan = loan.id === selectedLoanId;
        const totalPaid = isSelectedLoan
            ? Math.max(totalFromLoanList, repaymentTotalPaid)
            : totalFromLoanList;

        if (loan.loanDetails?.status === "PAID") {
            return Math.max(totalPaid, approvedAmount);
        }

        return totalPaid;
    }, [repaymentTotalPaid, selectedLoanId]);

    // 2. DYNAMIC CALCULATION: Adjusted map parameters length loops to read each loan's context properties
    const generateInstallments = (loan: LoanApplication) => {
        if (!loan || !selectedLoanDueDate) return [];
        const baseDate = new Date(selectedLoanDueDate);
        const approvedAmount = Number(loan.loanDetails?.approvedAmount || 0);
        const totalPaid = getLoanTotalPaid(loan);
        
        // Pick individual application specific configuration value directly
        const loanSpecificFreq = loan.installmentFreq ?? 4;
        const installmentAmount = loanSpecificFreq > 0 ? approvedAmount / loanSpecificFreq : 0;

        return Array.from({ length: loanSpecificFreq }).map((_, i) => {
            const date = new Date(baseDate);
            date.setMonth(date.getMonth() - (loanSpecificFreq - 1 - i));
            const installmentPaidAmount = Math.min(
                Math.max(totalPaid - (installmentAmount * i), 0),
                installmentAmount
            );
            const isPaid = loan.loanDetails?.status === "PAID" || installmentPaidAmount >= installmentAmount;

            return {
                order: i + 1,
                date: date,
                paidAmount: installmentPaidAmount,
                amount: installmentAmount,
                status: isPaid ? "paid" : getInstallmentStatus(date, loan.loanDetails?.status),
            };
        });
    };

    const totalRemainingUnpaid = useMemo(() => {
        return applications.reduce((sum, app) => {
            if (!app.loanDetails) return sum;
            const approvedAmount = Number(app.loanDetails.approvedAmount || 0);
            const paidAmount = getLoanTotalPaid(app);
            const remaining = Math.max(approvedAmount - paidAmount, 0);
            return sum + remaining;
        }, 0);
    }, [applications, getLoanTotalPaid]);

    const selectedRemainingUnpaid = useMemo(() => {
        if (!selectedLoan?.loanDetails) return 0;
        const approvedAmount = Number(selectedLoan.loanDetails.approvedAmount || 0);
        const paidAmount = getLoanTotalPaid(selectedLoan);
        return Math.max(approvedAmount - paidAmount, 0);
    }, [getLoanTotalPaid, selectedLoan]);

    const nearestDueDateLabel = nearestDueDate
        ? nearestDueDate.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : "Belum ada jatuh tempo";

    const selectedLoanStatusLabel = selectedLoan
        ? formatStatus(selectedLoan.loanDetails?.status ?? selectedLoan.status)
        : "-";

    if (isLoading) return <div className="flex h-screen items-center justify-center bg-[#F3F5F7] text-sm text-[#6B7280]">Memuat...</div>;

    if (isCheckingVerification) return (
        <div className="min-h-screen bg-[#F3F5F7] text-[#111827]">
            <ApplicantDashboard_ApplicantNavbar />
            <main className="mx-auto w-full max-w-350 px-6 pb-10 pt-8">
                <div className="rounded-lg border border-[#E2E8F0] bg-white p-8 text-sm font-semibold text-[#667085] shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
                    Memeriksa status verifikasi akun...
                </div>
            </main>
        </div>
    );

    if (!isBorrowerVerified) return (
        <div className="min-h-screen bg-[#F3F5F7] text-[#111827]">
            <ApplicantDashboard_ApplicantNavbar />
            <main className="mx-auto w-full max-w-350 px-6 pb-10 pt-8">
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
                                    href="/"
                                    className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-gray-50"
                                >
                                    Kembali ke Beranda
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F3F5F7] text-[#111827]">
            {isRepaymentModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 px-4">
                    <div className="absolute inset-0" onClick={() => setIsRepaymentModalOpen(false)}></div>
                    <Suspense fallback={<div className="p-10">Memuat detail pembayaran...</div>}>
                        <div className="relative z-101 rounded-xl bg-white p-6 shadow-2xl">
                            <ApplicantDashboard_PaymentApplicantComponent 
                                searchParams={Promise.resolve({ 
                                    type: 'repayment', 
                                    referenceId: selectedLoanId 
                                })} 
                            />
                            <button 
                                onClick={() => setIsRepaymentModalOpen(false)}
                                className="absolute top-2 right-2 text-gray-500 hover:text-black text-lg p-1 font-bold"
                            >
                                ✕
                            </button>
                        </div>
                    </Suspense>
                </div>
            )}

            <ApplicantDashboard_ApplicantNavbar />

            <main className="mx-auto w-full max-w-350 px-6 pb-10 pt-8">
                <section>
                    <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
                        Selamat Datang Kembali, <span className="text-[#07B0C8]">{username}</span>
                    </h1>
                    <p className="mt-1.5 text-sm text-[#6B7280]">
                        Pantau status pinjaman dan pembayaran Anda di sini.
                    </p>
                    {fetchError && (
                        <p className="mt-2 text-sm text-red-600">{fetchError}</p>
                    )}
                </section>

                <section className="mt-8 grid gap-4 md:grid-cols-3">
                    <article className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-[0_3px_10px_-8px_rgba(17,24,39,0.18)] md:px-5 md:py-5">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#07B0C8]/12 text-[#07B0C8]">
                            <CreditCard className="h-4 w-4" strokeWidth={2.2} />
                        </div>
                        <p className="text-xs font-medium text-[#6B7280]">Sisa Pinjaman</p>
                        <p className="mt-1 text-xl font-bold leading-tight tracking-tight text-[#111827]">
                            {formatIdr(totalRemainingUnpaid)}
                        </p>
                    </article>

                    <article className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-[0_3px_10px_-8px_rgba(17,24,39,0.18)] md:px-5 md:py-5">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#FCB82E]/15 text-[#C87900]">
                            <CalendarDays className="h-4 w-4" strokeWidth={2.2} />
                        </div>
                        <p className="text-xs font-medium text-[#6B7280]">Jatuh Tempo Terdekat</p>
                        <p className="mt-1 text-xl font-bold leading-tight tracking-tight text-[#111827]">
                            {nearestDueDateLabel}
                        </p>
                    </article>

                    <article className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-[0_3px_10px_-8px_rgba(17,24,39,0.18)] md:px-5 md:py-5">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#10B981]/12 text-[#009966]">
                            <FileCheck2 className="h-4 w-4" strokeWidth={2.2} />
                        </div>
                        <p className="text-xs font-medium text-[#6B7280]">Status Pinjaman Dipilih</p>
                        <p className="mt-1 text-xl font-bold leading-tight tracking-tight text-[#111827]">
                            {selectedLoanStatusLabel}
                        </p>
                    </article>
                </section>

                <section className="mt-6 rounded-xl border border-[#FDE68A] bg-[#FEFCE8] p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-bold text-[#111827]">Jatuh tempo terdekat</p>
                            <p className="mt-1 text-[13px] text-[#6B7280]">{nearestDueDateLabel}</p>
                        </div>
                        <Link
                            href="/applicant/installment"
                            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#009966] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#007A52]"
                        >
                            Bayar Sekarang
                        </Link>
                    </div>
                </section>

                <section className="mt-6 grid gap-2 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab("detail")}
                        className={`h-11 rounded-xl border px-4 text-sm font-semibold transition-colors ${
                            activeTab === "detail"
                                ? "bg-[#07B0C8] text-white border-transparent"
                                : "bg-white text-[#07B0C8] border-[#D8E4EA] hover:bg-[#F0FBFD]"
                        }`}
                    >
                        Detail Pinjaman
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("riwayat")}
                        className={`h-11 rounded-xl border px-4 text-sm font-semibold transition-colors ${
                            activeTab === "riwayat"
                                ? "bg-[#07B0C8] text-white border-transparent"
                                : "bg-white text-[#07B0C8] border-[#D8E4EA] hover:bg-[#F0FBFD]"
                        }`}
                    >
                        Riwayat Pembayaran
                    </button>
                </section>

                {activeTab === "detail" && (
                    <>
                        <section className="mt-6 flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#111827]">Pilih Pinjaman</label>
                            <select
                                value={selectedLoanId}
                                onChange={(e) => setSelectedLoanId(e.target.value)}
                                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-[#111827] shadow-[0_3px_10px_-8px_rgba(17,24,39,0.18)] outline-none focus:ring-2 focus:ring-[#07B0C8]/30"
                            >
                                {applications.length === 0 && (
                                    <option value="">Belum ada pinjaman</option>
                                )}
                                {applications.map((app) => (
                                    <option key={app.id} value={app.id}>
                                        {app.description} - {formatIdr(Number(app.loanDetails?.approvedAmount ?? app.requestedAmount))} ({app.loanDetails?.status ?? app.status})
                                    </option>
                                ))}
                            </select>
                        </section>

                        {selectedLoan?.loanDetails && (selectedLoan.loanDetails.status === "ACTIVE" || selectedLoan.loanDetails.status === "PAID") && (
                            <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-[0_3px_10px_-8px_rgba(17,24,39,0.18)] md:p-5">
                                <div className="text-xs font-medium text-[#6B7280]">Sisa Pinjaman Belum Lunas</div>
                                <div className="mt-1 text-xl font-bold text-[#111827]">
                                    {formatIdr(selectedRemainingUnpaid)}
                                </div>
                            </section>
                        )}

                        <section className="mt-6 grid gap-4 pb-10 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_460px]">
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-[0_3px_10px_-8px_rgba(17,24,39,0.18)] md:p-5">
                                <h2 className="mb-3 text-lg font-bold text-[#111827]">Jadwal Pembayaran</h2>
                                <div className="min-h-80">
                                    {!selectedLoan && (
                                        <p className="py-16 text-center text-[13px] text-[#9CA3AF]">Pilih pinjaman untuk melihat jadwal.</p>
                                    )}
                                    {selectedLoan && !scheduleAvailable && (
                                        <p className="py-16 text-center text-[13px] text-[#9CA3AF]">
                                            Jadwal pembayaran belum tersedia untuk status {formatStatus(selectedApplicationStatus)}.
                                        </p>
                                    )}
                                    {selectedLoan && scheduleAvailable && generateInstallments(selectedLoan).map((inst) => (
                                        <ApplicantDashboard_PaymentScheduleRow
                                            key={inst.order}
                                            installment_value={inst.amount || installmentValue}
                                            installment_paid_value={inst.paidAmount}
                                            installment_date={inst.date}
                                            installment_order={inst.order}
                                            installment_status={inst.status}
                                        />
                                    ))}
                                </div>
                            </div>

                            <ApplicantDashboard_ApplicationProgressComponent
                                submitTime={selectedLoan?.createdAt ? new Date(selectedLoan.createdAt) : null}
                                verifiedTime={selectedLoan?.loanDetails?.approvedAt ? new Date(selectedLoan.loanDetails.approvedAt) : null}
                                disbursedTime={selectedLoan?.loanDetails?.approvedAt ? new Date(selectedLoan.loanDetails.approvedAt) : null}
                                applicationStatus={selectedLoan?.status || null}
                                loanStatus={selectedLoan?.loanDetails?.status || null}
                            />
                        </section>
                    </>
                )}

                {activeTab === "riwayat" && (
                    <section className="mt-6 pb-10">
                        <h2 className="mb-4 text-lg font-bold text-[#111827]">Riwayat Pembayaran</h2>
                        {historyError && (
                            <p className="text-sm text-red-600 mb-4">{historyError}</p>
                        )}
                        {historyLoading && (
                            <p className="text-gray-500">Memuat riwayat pembayaran...</p>
                        )}
                        {!historyLoading && repaymentHistory.length === 0 && (
                            <p className="text-gray-400 text-center py-10">Belum ada riwayat pembayaran.</p>
                        )}
                        <div className="flex flex-col gap-4">
                            {repaymentHistory.map((item) => {
                                const statusStyle = repaymentStatusStyle(item.status);

                                return (
                                    <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-[0_3px_10px_-8px_rgba(17,24,39,0.18)]">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="font-semibold">
                                                    {item.loanName || "Pinjaman"}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Jumlah pembayaran: <span className="font-bold text-[#07B0C8]">{formatIdr(item.amount)}</span>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-600 font-semibold">
                                                Tanggal pembayaran: {new Date(item.paidAt).toLocaleDateString("id-ID", {
                                                    day: "2-digit",
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </div>
                                            <div
                                                className="text-xs font-semibold w-fit rounded-full px-3 py-1"
                                                style={{ background: statusStyle.bg, color: statusStyle.text }}
                                            >
                                                {formatStatus(item.status)}
                                            </div>
                                            <div className="pt-2 text-xs text-gray-400">
                                                ID Repayment: {item.id}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                ID Loan: {item.loanId}
                                            </div>
                                            {item.paymentTransactionId && (
                                                <div className="text-xs text-gray-400">
                                                    ID Transaksi: {item.paymentTransactionId}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}