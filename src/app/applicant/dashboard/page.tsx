"use client";

import Image from "next/image";
import Link from "next/link";
import CalendarLogo from "../../../../public/calendar.svg"
import { useUserStore } from "@/hooks/userStore";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo, Suspense } from "react";
import ApplicantDashboard_PaymentScheduleRow from "@/components/ui/applicant-dashboard/payment_schedule_block";
import ApplicantDashboard_ApplicationProgressComponent from "@/components/ui/applicant-dashboard/application_progress_block";
import ApplicantDashboard_ApplicantNavbar from "@/components/ui/applicant-dashboard/applicant_navbar";
import ApplicantDashboard_PaymentApplicantComponent from "@/components/ui/applicant-dashboard/payment_applicant_modal";

type LoanApplication = {
    id: string;
    requestedAmount: number;
    status: string;
    description: string;
    createdAt: string;
    dueDate?: string | null;
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

    const installmentFreq = 4;
    const [applications, setApplications] = useState<LoanApplication[]>([]);
    const [selectedLoanId, setSelectedLoanId] = useState<string>("");
    const [totalValue, setTotalValue] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string>("");
    const [repaymentTotalPaid, setRepaymentTotalPaid] = useState<number>(0);
    const [repaymentHistory, setRepaymentHistory] = useState<RepaymentHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string>("");

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
        const fetchAllLoans = async () => {
            if (status === "loading") {
                return;
            }

            if (!userId) {
                setApplications([]);
                setTotalValue(0);
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
                const apps = (result.data?.applications || []) as LoanApplication[];

                setApplications(apps);
                setTotalValue(result.data.totalLoanedValue || 0);

                // Set initial selection to the first loan
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
        }
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

    // 1. Logic for choosing the nearest due date across ALL loans
    const nearestDueDate = useMemo(() => {
        const activeDates = applications
            .filter(app => app.status === "APPROVED")
            .map(app => app.loanDetails?.dueDate || app.dueDate)
            .map((dueDate) => (dueDate ? new Date(dueDate).getTime() : null))
            .filter((date): date is number => date !== null && date > Date.now());

        return activeDates.length > 0 ? new Date(Math.min(...activeDates)) : null;
    }, [applications]);

    // 2. Logic for the currently selected loan's installments
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

    const installmentValue = useMemo(() => {
        if (!selectedLoan) return 0;
        const amount = selectedLoan.loanDetails?.approvedAmount ?? selectedLoan.requestedAmount;
        return Number(amount) / installmentFreq;
    }, [selectedLoan]);

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
            } finally {
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

    const generateInstallments = (loan: LoanApplication) => {
        if (!loan || !selectedLoanDueDate) return [];
        const baseDate = new Date(selectedLoanDueDate);
        const approvedAmount = Number(loan.loanDetails?.approvedAmount || 0);
        const totalPaid = loan.loanDetails?.totalPaid ?? repaymentTotalPaid;
        const installmentAmount = installmentFreq > 0 ? approvedAmount / installmentFreq : 0;
        const paidInstallments = installmentAmount > 0
            ? Math.floor(totalPaid / installmentAmount)
            : 0;

        return Array.from({ length: installmentFreq }).map((_, i) => {
            // Subtract months based on index to show progress backwards from due date
            const date = new Date(baseDate);
            date.setMonth(date.getMonth() - (installmentFreq - 1 - i));
            const isPaid = loan.loanDetails?.status === "PAID" || i < paidInstallments;

            return {
                order: i + 1,
                date: date,
                status: isPaid ? "paid" : getInstallmentStatus(date, loan.loanDetails?.status),
            };
        });
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen">Memuat...</div>;

    return (
        <div className="flex flex-col justify-start items-center w-full min-h-screen bg-[#F9FAFB] gap-4">

            {isRepaymentModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-100">
                    {/* Background Click to Close */}
                    <div className="absolute inset-0" onClick={() => setIsRepaymentModalOpen(false)}></div>

                    <Suspense fallback={<div className="p-10">Loading Payment Details...</div>}>
                        <div className="relative z-101 bg-white p-8 rounded-2xl shadow-2xl">
                            <ApplicantDashboard_PaymentApplicantComponent 
                                searchParams={Promise.resolve({ 
                                    type: 'repayment', 
                                    referenceId: selectedLoanId 
                                })} 
                            />

                            {/* Tombol Close manual karena signature komponen tidak menerima prop onClose */}
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

            <div className="w-[90%] pt-10">
                <h1 className="text-4xl font-bold">
                    Selamat Datang Kembali, <span className="text-[#FCB82E]">{username}</span>
                </h1>
                <p className="text-lg text-gray-500 mt-2">
                    Kedermawanan Anda membantu hidup orang lain - terima kasih atas kontribusi Anda.
                </p>
                {fetchError && (
                    <p className="mt-2 text-sm text-red-600">{fetchError}</p>
                )}
            </div>

            {/* Loan Status Card */}
            <div className="flex flex-col gap-2 w-[90%] bg-white shadow-xl p-6 rounded-2xl">
                <span className="text-sm text-[#4A5565]">Status Pinjaman Terkini</span>
                <span className="text-5xl font-bold">{formatIdr(totalValue)}</span>
                <span className="text-sm text-[#4A5565]">Sisa Saldo Pinjaman</span>
            </div>

            {/* Nearest Due Date Banner */}
            <div className="flex justify-between items-center w-[90%] bg-[#FEFCE8] p-4 rounded-2xl border border-yellow-100">
                <div className="flex items-center gap-4">
                    <Image src={CalendarLogo} alt="Calendar" width={40} height={40} />
                    <div>
                        <p className="font-semibold">Jatuh tempo terdekat</p>
                        <p className="text-gray-500 text-sm">
                            {nearestDueDate
                                ? nearestDueDate.toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' })
                                : "Belum ada jatuh tempo terdekat"}
                        </p>
                    </div>
                </div>
                <Link href="/applicant/installment" className="inline-flex">
                    <button
                        type="button"
                        className="px-6 py-3 rounded-xl bg-[#009966] text-white font-bold hover:bg-[#007a52] transition-all"
                    >
                        Bayar Sekarang
                    </button>
                </Link>
            </div>

            <div className="w-[90%] flex gap-2">
                <button
                    type="button"
                    onClick={() => setActiveTab("detail")}
                    className={`flex-1 rounded-xl px-4 py-2 font-semibold border ${
                        activeTab === "detail"
                            ? "bg-[#07B0C8] text-white border-transparent"
                            : "bg-white text-[#07B0C8] border-[#D8E4EA]"
                    }`}
                >
                    Detail Pinjaman
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("riwayat")}
                    className={`flex-1 rounded-xl px-4 py-2 font-semibold border ${
                        activeTab === "riwayat"
                            ? "bg-[#07B0C8] text-white border-transparent"
                            : "bg-white text-[#07B0C8] border-[#D8E4EA]"
                    }`}
                >
                    Riwayat Pembayaran
                </button>
            </div>

            {activeTab === "detail" && (
                <>
                    {/* Selection Dropdown */}
                    <div className="w-[90%] flex flex-col gap-2">
                        <label className="text-lg font-semibold">Pilih Pinjaman</label>
                        <select
                            value={selectedLoanId}
                            onChange={(e) => setSelectedLoanId(e.target.value)}
                            className="w-full p-4 rounded-xl bg-white border border-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-[#FCB82E]"
                        >
                            {applications.map((app) => (
                                <option key={app.id} value={app.id}>
                                    {app.description} - {formatIdr(Number(app.loanDetails?.approvedAmount ?? app.requestedAmount))} ({app.loanDetails?.status ?? app.status})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Details Section */}
                    <div className="flex justify-between w-[90%] gap-6 pb-10">
                        {/* Installments */}
                        <div className="flex-1 bg-white rounded-2xl shadow-xl p-6">
                            <h3 className="font-bold text-lg mb-4">Jadwal Pembayaran</h3>
                            <div className="flex flex-col gap-3">
                                {!selectedLoan && (
                                    <p className="text-gray-400 text-center py-10">Pilih pinjaman untuk melihat jadwal.</p>
                                )}
                                {selectedLoan && !scheduleAvailable && (
                                    <p className="text-gray-400 text-center py-10">
                                        Jadwal pembayaran belum tersedia untuk status {formatStatus(selectedApplicationStatus)}.
                                    </p>
                                )}
                                {selectedLoan && scheduleAvailable && generateInstallments(selectedLoan).map((inst) => (
                                    <ApplicantDashboard_PaymentScheduleRow
                                        key={inst.order}
                                        installment_value={installmentValue}
                                        installment_date={inst.date}
                                        installment_order={inst.order}
                                        installment_status={inst.status}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="w-[35%] bg-white rounded-2xl shadow-xl h-full flex ">
                            <ApplicantDashboard_ApplicationProgressComponent
                                submitTime={selectedLoan?.createdAt ? new Date(selectedLoan.createdAt) : null}
                                verifiedTime={selectedLoan?.loanDetails?.approvedAt ? new Date(selectedLoan.loanDetails.approvedAt) : null}
                                disbursedTime={selectedLoan?.loanDetails?.approvedAt ? new Date(selectedLoan.loanDetails.approvedAt) : null}
                                applicationStatus={selectedLoan?.status || null}
                                loanStatus={selectedLoan?.loanDetails?.status || null}
                            />
                        </div>
                    </div>
                </>
            )}

            {activeTab === "riwayat" && (
                <div className="w-[90%] pb-10">
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <h3 className="font-bold text-lg mb-4">Riwayat Pembayaran</h3>
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
                            {repaymentHistory.map((item) => (
                                <div key={item.id} className="border border-gray-200 rounded-2xl p-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="font-semibold">
                                                {item.loanName || "Pinjaman"}
                                            </div>
                                            <div className="font-bold text-[#07B0C8]">
                                                {formatIdr(item.amount)}
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Tanggal pembayaran: {new Date(item.paidAt).toLocaleDateString("id-ID", {
                                                day: "2-digit",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            ID Repayment: {item.id}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            ID Loan: {item.loanId}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Status: {formatStatus(item.status)}
                                        </div>
                                        {item.paymentTransactionId && (
                                            <div className="text-sm text-gray-500">
                                                ID Transaksi: {item.paymentTransactionId}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}