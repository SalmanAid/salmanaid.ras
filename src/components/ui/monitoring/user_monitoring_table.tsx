"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Image from "next/image"
import DefaultAvatarLogo from "../../../../public/default-avatar.svg"
import { formatCurrency } from "@/lib/utils"

type UserAggregate = {
    id: string;
    name: string;
    email: string;
    image: string | null;
    loanCount: number;
    totalBorrowed: number;
    totalRepaid: number;
    activeDebt: number;
    loans: any[];
}

export default function Monitoring_UserMonitoringTable({ 
    users, 
    isLoading = false,
    onUserClick
}: { 
    users: UserAggregate[], 
    isLoading?: boolean,
    onUserClick: (user: UserAggregate) => void 
}) {

    if (isLoading) {
        return (
            <div className="w-full h-64 flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 border-4 border-[#00B5D8]/20 border-t-[#00B5D8] rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Memuat data pengguna...</p>
            </div>
        );
    }

    if (!users || users.length === 0) {
        return <div className="p-10 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">Tidak ada peminjam yang ditemukan</div>
    }

    return (
        <div className="w-full">
            {/* ── 1. MOBILE FORMAT: STACKED CARDS LIST (Visible ONLY on mobile/tablet) ── */}
            <div className="block lg:hidden space-y-4">
                {users.map((user) => (
                    <div key={user.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-100 shrink-0">
                                <Image 
                                    src={user.image || DefaultAvatarLogo} 
                                    alt="Profile" 
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="font-bold text-[#1E293B] text-sm truncate max-w-45">
                                    {user.name || "Unknown User"}
                                </span>
                                <span className="text-[#64748B] text-[11px] font-medium uppercase tracking-tight truncate max-w-45">
                                    {user.email}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 border-y border-gray-50 py-3">
                            <div>
                                <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Total Dipinjam</p>
                                <p className="font-bold text-[#1E293B] text-sm">
                                    {formatCurrency(user.totalBorrowed)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Total Dikembalikan</p>
                                <p className="font-bold text-[#1E293B] text-sm">
                                    {formatCurrency(user.totalRepaid)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Total Pinjaman</p>
                                <p className="font-bold text-[#1E293B] text-sm">
                                    {user.loanCount} Pinjaman
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Hutang Aktif</p>
                                <p className="font-bold text-red-600 text-sm">
                                    {formatCurrency(user.activeDebt)}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-1">
                            <button 
                                onClick={() => onUserClick(user)}
                                className="px-5 py-2 rounded-lg text-xs font-bold transition-all hover:brightness-95 active:scale-95 shadow-sm shrink-0 bg-[#00B5D8] text-white"
                            >
                                Lihat Detail
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── 2. DESKTOP FORMAT: STANDARD FULL TABLE (Visible ONLY on desktop screen sizes) ── */}
            <div className="hidden lg:block w-full border-t border-gray-100 bg-white rounded-xl shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-[#F9FAFB]">
                        <TableRow>
                            <TableHead className="text-[#64748B] font-semibold text-xs uppercase px-6">Peminjam</TableHead>
                            <TableHead className="text-[#64748B] font-semibold text-xs uppercase text-center">Total Pinjaman</TableHead>
                            <TableHead className="text-[#64748B] font-semibold text-xs uppercase text-right">Total Dipinjam</TableHead>
                            <TableHead className="text-[#64748B] font-semibold text-xs uppercase text-right">Total Dikembalikan</TableHead>
                            <TableHead className="text-[#64748B] font-semibold text-xs uppercase text-right">Hutang Aktif</TableHead>
                            <TableHead className="text-[#64748B] font-semibold text-xs uppercase text-center">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id} className="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                                <TableCell className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-100 shrink-0">
                                            <Image 
                                                src={user.image || DefaultAvatarLogo} 
                                                alt="Profile" 
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[#1E293B] text-sm">
                                                {user.name || "Unknown User"}
                                            </span>
                                            <span className="text-[#64748B] text-[11px] font-medium uppercase tracking-tight">
                                                {user.email}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell className="text-[#475569] text-sm font-bold text-center">
                                    {user.loanCount}
                                </TableCell>

                                <TableCell className="font-bold text-[#1E293B] text-sm text-right">
                                    {formatCurrency(user.totalBorrowed)}
                                </TableCell>

                                <TableCell className="font-bold text-[#1E293B] text-sm text-right">
                                    {formatCurrency(user.totalRepaid)}
                                </TableCell>

                                <TableCell className="font-bold text-red-600 text-sm text-right">
                                    {formatCurrency(user.activeDebt)}
                                </TableCell>

                                <TableCell>
                                    <div className="flex justify-center">
                                        <button 
                                            onClick={() => onUserClick(user)}
                                            className="px-5 py-1.5 rounded-lg text-xs font-bold transition-all hover:brightness-95 active:scale-95 shadow-sm bg-[#00B5D8] text-white"
                                        >
                                            Lihat Detail
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
