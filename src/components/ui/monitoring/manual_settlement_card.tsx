import { useLoanStore } from "@/hooks/loanStore";
import { useState } from "react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/utils";
import { LoanStatus } from "@/generated/prisma";

export default function Monitoring_ManualSettlementCard() {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [reductionAmount, setReductionAmount] = useState<number>(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

    const selectedLoan = useLoanStore((state) => state.selected_loan);
    const setSelectedLoan = useLoanStore((state) => state.setSelectedLoan);
    const setManualSettlementCardOpen = useLoanStore((state) => state.setIsManualSettlementCardOpen);
    const loans = useLoanStore((state) => state.loans);
    const setLoans = useLoanStore((state) => state.setLoans);

    const approvedAmount = selectedLoan.approvedAmount;
    const totalPaid = selectedLoan.totalPaid;
    const forgivenAmount = selectedLoan.forgivenAmount || 0;
    const remainingUnpaid = Math.max(approvedAmount - totalPaid - forgivenAmount, 0);

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case "FORGIVEN": return "bg-purple-100 text-purple-700";
            case "ACTIVE": return "bg-emerald-100 text-emerald-700";
            case "PAID": return "bg-green-100 text-green-700";
            case "DEFAULTED": return "bg-red-100 text-red-700";
            default: return "bg-amber-100 text-amber-700";
        }
    };

    const handleConfirmAdjustment = async () => {
        setErrorMessage(null);
        setSubmitSuccess(null);
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/repayments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    loanId: selectedLoan.id,
                    amount: reductionAmount,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Gagal memproses penyesuaian");
            }

            setSubmitSuccess("Pengurangan berhasil dicatat.");

            const newTotalPaid = Number(selectedLoan.totalPaid) + reductionAmount;
            const newForgivenAmount = Number(selectedLoan.forgivenAmount || 0) + reductionAmount;
            const isFullyPaid = newTotalPaid >= Number(selectedLoan.approvedAmount);
            const newStatus: LoanStatus = isFullyPaid ? LoanStatus.PAID : LoanStatus.FORGIVEN;

            setSelectedLoan({
                ...selectedLoan,
                status: newStatus,
                forgivenAmount: newForgivenAmount,
                totalPaid: newTotalPaid,
            });

            const updatedLoans = loans.map((loan) => {
                if (loan.id === selectedLoan.id) {
                    return {
                        ...loan,
                        status: newStatus,
                        forgivenAmount: newForgivenAmount,
                        totalPaid: newTotalPaid,
                    };
                }
                return loan;
            });
            setLoans(updatedLoans);
        } catch (error: any) {
            setErrorMessage(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-[70%] max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl flex flex-col h-137.5 text-slate-800 overflow-hidden px-8 py-4">
            {/* Header */}
            <div className="flex flex-col justify-between py-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Atur Nilai Pinjaman Manual</h2>
                <button className="text-gray-400 hover:text-slate-700" onClick={() => setManualSettlementCardOpen(false)}>✕</button>
            </div>
                <p className="text-gray-500 text-sm mt-1">Pengurangan Manual untuk pinjaman ini</p>
            </div>

            {/* scrollable section */}
            <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
            
            {/* Loan Overview Card */}
            <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-100 mb-6">
                <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Peminjam</p>
                    <p className="font-bold text-lg">{selectedLoan.application.borrower.name}</p>
                    <p className="text-xs text-slate-500">{selectedLoan.id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getStatusBadgeClass(selectedLoan.status)}`}>
                    {selectedLoan.status}
                </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                    <p className="text-[10px] text-slate-400 font-medium">Jumlah Pinjaman Awal</p>
                    <p className="font-bold text-slate-700">{formatCurrency(approvedAmount)}</p>
                </div>
                <div className="flex flex-col">
                    <p className="text-[10px] text-slate-400 font-medium">Jumlah Terbayar hingga Kini</p>
                    <p className="font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="flex flex-col">
                    <p className="text-[10px] text-slate-400 font-medium">Jumlah Tak Terbayar</p>
                    <p className="font-bold text-amber-600">{formatCurrency(remainingUnpaid)}</p>
                </div>
                {forgivenAmount > 0 && (
                    <div className="flex flex-col">
                        <p className="text-[10px] text-slate-400 font-medium">Total Dihapuskan</p>
                        <p className="font-bold text-purple-600">{formatCurrency(forgivenAmount)}</p>
                    </div>
                )}
                </div>
            </div>

            {/* Input Section */}
            <div className="flex flex-col gap-4">
                <div className="space-y-2">
                <label className="font-bold text-sm text-slate-600">Jumlah pengurangan</label>
                <div className="relative">
                    <CurrencyInput
                    placeholder="Rp0"
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 px-4 text-lg font-bold text-slate-800 focus:border-[#87DCE9] focus:ring-4 focus:ring-[#87DCE9]/10 outline-none transition-all"
                    value={reductionAmount}
                    onValueChange={(value) => setReductionAmount(value)}
                    />
                </div>
                <div className="flex justify-between items-center px-1">
                    <p className="text-[11px] text-slate-400">Jumlah yang ingin dikurangi dari jumlah pinjaman tak terbayar</p>
                    <button 
                        onClick={() => setReductionAmount(remainingUnpaid)}
                        className="text-[11px] font-bold text-[#00B5D8] hover:underline"
                    >
                        100%
                    </button>
                </div>
                </div>

                {/* Calculation Summary */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Nilai Akhir</span>
                    <span className="font-bold text-slate-800">
                        {formatCurrency(Math.max(0, remainingUnpaid - (reductionAmount || 0)))}
                    </span>
                </div>
                </div>
            </div>
            </div>

            {/* Action Buttons */}
            <div className="p-8 pt-4 bg-white border-t border-slate-50">
                {(errorMessage || submitSuccess) && (
                    <p className={`mb-3 rounded-xl px-4 py-3 text-sm font-medium ${errorMessage ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
                        {errorMessage || submitSuccess}
                    </p>
                )}

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setManualSettlementCardOpen(false)}
                        disabled={isSubmitting}
                        className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                        {submitSuccess ? "Tutup" : "Batal"}
                    </button>
                    {!submitSuccess && (
                        <button
                            type="button"
                            onClick={handleConfirmAdjustment}
                            disabled={!reductionAmount || reductionAmount <= 0 || reductionAmount > remainingUnpaid || isSubmitting}
                            className="flex-2 py-3 bg-[#87DCE9] rounded-xl font-bold text-white shadow-lg shadow-[#87DCE9]/20 hover:bg-[#76cad7] disabled:bg-slate-200 disabled:shadow-none disabled:text-slate-400 transition-all"
                        >
                            {isSubmitting ? "Menyesuaikan..." : "Konfirmasi Penyesuaian"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
