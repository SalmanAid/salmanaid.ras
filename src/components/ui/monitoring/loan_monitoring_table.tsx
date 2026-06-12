"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useLoanStore } from "@/hooks/loanStore"
import Image from "next/image"
import { useRouter } from "next/navigation"
import DefaultAvatarLogo from "../../../../public/default-avatar.svg"
import { LoanStatus } from "@/generated/prisma"
import { Loan } from "@/types/loan"
import { formatCurrency } from "@/lib/utils"

// ===============================
// HELPERS
// ===============================
const StatusActionDict = {
    "FORGIVEN": {
        "status_bg": "#FEF3C6",
        "status_text": "#BB4D00",
        "action_caption": "Review",
        "action_bg": "#E0F7FA",
        "action_text": "#00B5D8",
    },
    "ACTIVE": {
        "status_bg": "#D0FAE5",
        "status_text": "#007A55",
        "action_caption": "See Detail",
        "action_bg": "#FEFCE8",
        "action_text": "#FCB82E",
    },
    "PAID": {
        "status_bg": "#D0FAE5",
        "status_text": "#007A55",
        "action_caption": "See Detail",
        "action_bg": "#FEFCE8",
        "action_text": "#FCB82E",
    },
    "DEFAULTED": {
        "status_bg": "#FFE2E2",
        "status_text": "#C10007",
        "action_caption": "See Detail",
        "action_bg": "#FEFCE8",
        "action_text": "#FCB82E",
    },
}

const formatDate = (dateInput: string | number | Date) => {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return "Tanggal tidak valid";

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
    }).format(date);
};

// ===============================
// COMPONENT
// ===============================
export default function Monitoring_LoanMonitoringTable({ isLoading = false }: { isLoading?: boolean }) {
    const router = useRouter();
    const loans = useLoanStore((state) => state.loans);
    const isManualSettlementCardOpen = useLoanStore((state) => state.isManualSettlementCardOpen)
    const setSelectedLoan = useLoanStore((state) => state.setSelectedLoan);
    const setManualSettlementCardOpen = useLoanStore((state) => state.setIsManualSettlementCardOpen);

    const handleActionClick = (loan: Loan) => {
        const status = loan.status as keyof typeof StatusActionDict || "ACTIVE";
        
        setSelectedLoan({
            id: loan.id || "",
            approvedAmount: Number(loan.approvedAmount || 0),
            status: status,
            approvedAt: loan.approvedAt || "",
            dueDate: loan.dueDate || "",
            application: loan.application,
            _count: loan._count,
            totalPaid : loan.totalPaid
        });

        setManualSettlementCardOpen(!isManualSettlementCardOpen)
    };

    if (isLoading) {
        return (
            <div className="w-full h-64 flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 border-4 border-[#00B5D8]/20 border-t-[#00B5D8] rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Memuat data pinjaman...</p>
            </div>
        );
    }

    if (!loans || loans.length === 0) {
        return <div className="p-10 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">Tidak ada pengajuan pinjaman yang perlu diperhatikan</div>
    }

    return (
        <div className="w-full">
            
            {/* ── 1. MOBILE FORMAT: STACKED CARDS LIST (Visible ONLY on mobile/tablet) ── */}
            <div className="block lg:hidden space-y-4">
                {loans.map((loan: any) => {
                    const statusKey = (loan.status || "ACTIVE").toUpperCase() as keyof typeof StatusActionDict;
                    const config = StatusActionDict[statusKey] || StatusActionDict["ACTIVE"];

                    return (
                        <div key={loan.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
                            
                            {/* Header: User Profile & Status */}
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-100 shrink-0">
                                        <Image 
                                            src={loan.image || DefaultAvatarLogo} 
                                            alt="Profile" 
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-[#1E293B] text-sm truncate max-w-45">
                                            {loan.application?.borrower?.name || "Unknown User"}
                                        </span>
                                        <span className="text-[#64748B] text-[11px] font-medium uppercase tracking-tight truncate max-w-45">
                                            {loan.application?.borrower?.email}
                                        </span>
                                    </div>
                                </div>
                                
                                <div 
                                    className="px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0"
                                    style={{ backgroundColor: config.status_bg, color: config.status_text }}
                                >
                                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: config.status_text }}></span>
                                    {loan.status}
                                </div>
                            </div>

                            {/* Description Block */}
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Deskripsi</p>
                                <p className="text-[#475569] text-xs font-medium line-clamp-2">
                                    {loan.application?.description || "No description provided"}
                                </p>
                            </div>

                            {/* Financial Details Metrics Group */}
                            <div className="grid grid-cols-2 gap-3 border-y border-gray-50 py-3">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Jumlah Disetujui</p>
                                    <p className="font-bold text-[#1E293B] text-sm">
                                        {formatCurrency(Number(loan.approvedAmount))}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Pembayaran tersisa</p>
                                    <p className="font-bold text-[#1E293B] text-sm">
                                        {formatCurrency(Number(loan.approvedAmount - loan.totalPaid))}
                                    </p>
                                </div>
                            </div>

                            {/* Footer: Date & Bottom Full-width Action Button */}
                            <div className="flex justify-between items-center gap-4 pt-1">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-slate-400 font-medium uppercase">Tanggal Disetujui</span>
                                    <span className="text-[#64748B] text-xs font-medium">{formatDate(loan.approvedAt)}</span>
                                </div>

                                <button 
                                    onClick={() => handleActionClick(loan)}
                                    className="px-5 py-2 rounded-lg text-xs font-bold transition-all hover:brightness-95 active:scale-95 shadow-sm shrink-0"
                                    style={{ backgroundColor: config.action_bg, color: config.action_text }}
                                >
                                    {config.action_caption}
                                </button>
                            </div>

                        </div>
                    );
                })}
            </div>

            {/* ── 2. DESKTOP FORMAT: STANDARD FULL TABLE (Visible ONLY on desktop screen sizes) ── */}
            <div className="hidden lg:block w-full border-t border-gray-100 bg-white rounded-xl shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-[#F9FAFB]">
                        <TableRow>
                            <TableHead className="text-[#64748B] font-semibold text-xs uppercase px-6">Detail Pengaju Pinjaman</TableHead>
                            <TableHead className="text-[#64748B] font-semibold text-xs uppercase">Deskripsi</TableHead>
                            <TableHead className="text-[#64748B] font-semibold text-xs uppercase">Jumlah yang Diajukan</TableHead>
                            <TableHead className="text-[#64748B] font-semibold text-xs uppercase">Pembayaran Pinjaman Tersisa</TableHead>
                            <TableHead className="text-[#64748B] font-semibold text-xs uppercase">Tanggal Disetujui</TableHead>
                            <TableHead className="text-[#64748B] font-semibold text-xs uppercase text-center">Status</TableHead>
                            <TableHead className="text-[#64748B] font-semibold text-xs uppercase text-center">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loans.map((loan: any) => {
                            const statusKey = (loan.status || "ACTIVE").toUpperCase() as keyof typeof StatusActionDict;
                            const config = StatusActionDict[statusKey] || StatusActionDict["ACTIVE"];

                            return (
                                <TableRow key={loan.id} className="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                                    
                                    <TableCell className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-100 shrink-0">
                                                <Image 
                                                    src={loan.image || DefaultAvatarLogo} 
                                                    alt="Profile" 
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#1E293B] text-sm">
                                                    {loan.application?.borrower?.name || "Unknown User"}
                                                </span>
                                                <span className="text-[#64748B] text-[11px] font-medium uppercase tracking-tight">
                                                    {loan.application?.borrower?.email}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-[#475569] text-sm font-medium max-w-50 truncate">
                                        {loan.application?.description?.split('\n')[0] || "No description provided"}
                                    </TableCell>

                                    <TableCell className="font-bold text-[#1E293B] text-sm">
                                        {formatCurrency(Number(loan.approvedAmount))}
                                    </TableCell>

                                    <TableCell className="font-bold text-[#1E293B] text-sm">
                                        {formatCurrency(Number(loan.approvedAmount - loan.totalPaid))}
                                    </TableCell>

                                    <TableCell className="text-[#64748B] text-sm">
                                        {formatDate(loan.approvedAt)}
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex justify-center">
                                            <div 
                                                className="px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5"
                                                style={{ backgroundColor: config.status_bg, color: config.status_text }}
                                            >
                                                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: config.status_text }}></span>
                                                {loan.status}
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex justify-center">
                                            <button 
                                                onClick={() => handleActionClick(loan)}
                                                className="px-5 py-1.5 rounded-lg text-xs font-bold transition-all hover:brightness-95 active:scale-95 shadow-sm"
                                                style={{ backgroundColor: config.action_bg, color: config.action_text }}
                                            >
                                                {config.action_caption}
                                            </button>
                                        </div>
                                    </TableCell>

                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

        </div>
    );
}
