
import { useApplicationProgressStore } from "@/hooks/applicationProgressStore"
import { useState } from "react"

export default function ApplicantForm_FinancialNeedsSection() {

    const loan_title = useApplicationProgressStore((state) => (state.loan_title))
    const requested_amount = useApplicationProgressStore((state) => (state.requested_amount))
    const loan_purpose = useApplicationProgressStore((state) => (state.loan_purpose))
    const installment_freq = useApplicationProgressStore((state) => (state.installment_freq))

    const setLoanTitle = useApplicationProgressStore((state) => (state.setLoanTitle))
    const setLoanPurpose = useApplicationProgressStore((state) => (state.setLoanPurpose))
    const setRequestedAmount = useApplicationProgressStore((state) => (state.setRequestedAmount))
    const setInstallmentFreq = useApplicationProgressStore((state) => (state.setInstallmentFreq))

    const incrementStep = useApplicationProgressStore((state) => state.incrementStep)
    const decrementStep = useApplicationProgressStore((state) => state.decrementStep)
    const [requestedAmountInput, setRequestedAmountInput] = useState(
        Number.isFinite(requested_amount ?? NaN) && requested_amount !== 0
            ? String(requested_amount)
            : ""
    )

    const [installmentFreqInput, setInstallmentFreqInput] = useState(
        Number.isFinite(installment_freq ?? NaN) && installment_freq !== 0
            ? String(installment_freq)
            : ""
    )

    const handleBack = async () => {
        decrementStep()
    }

    const handleContinue = async () => {
        if (!isStepComplete) return
        incrementStep()
    }

    const handleRequestedAmountChange = (value: string) => {
        const normalizedValue = value.replace(/[^\d]/g, "")
        setRequestedAmountInput(normalizedValue)
        setRequestedAmount(normalizedValue === "" ? 0 : Number(normalizedValue))
    }

    const handleInstallmentFreqChange = (value: string) => {
        const normalizedValue = value.replace(/[^\d]/g, "")
        setInstallmentFreqInput(normalizedValue)

        if (normalizedValue === "") {
            setInstallmentFreq(0)
            return
        }

        const numValue = Number(normalizedValue)
        // Keep the global state within the 3-6 range bounds
        if (numValue >= 3 && numValue <= 6) {
            setInstallmentFreq(numValue)
        } else {
            setInstallmentFreq(0) // Invalidates step completeness if outside bounds
        }
    }

    const handleInstallmentBlur = () => {
        if (installmentFreqInput === "") return
        
        const numValue = Number(installmentFreqInput)
        if (numValue < 3) {
            setInstallmentFreqInput("3")
            setInstallmentFreq(3)
        } else if (numValue > 6) {
            setInstallmentFreqInput("6")
            setInstallmentFreq(6)
        }
    }

    const isStepComplete = Boolean(
        loan_title?.trim() &&
        Number(requested_amount) > 0 &&
        Number(installment_freq) >= 3 && 
        Number(installment_freq) <= 6 &&
        loan_purpose?.trim()
    )
    const inputClassName = "h-8 w-full rounded-md border border-[#D8DEE8] bg-[#F3F4F6] px-3 text-[13px] text-[#111827] shadow-inner outline-none transition placeholder:text-[#7B8190] focus:border-[#FCB82E] focus:bg-white focus:ring-2 focus:ring-[#FCB82E]/20"
    const labelClassName = "text-xs font-semibold text-[#111827]"
    
    return (
        <div className="rounded-lg border border-[#E2E8F0] bg-white px-7 py-8 shadow-[0_1px_3px_rgba(15,23,42,0.08)] sm:px-8">
            <div>
                <h2 className="text-[22px] font-extrabold leading-tight text-[#111827]">
                    Kebutuhan Finansial
                </h2>
                <p className="mt-2 text-xs font-medium text-[#667085]">
                    Jelaskan pada Kami soal kebutuhan pinjaman Anda
                </p>
            </div>

            <div className="mt-6 space-y-4">
                <label className="block">
                    <span className={labelClassName}>Judul Pinjaman *</span>
                    <input
                        value={String(loan_title)}
                        onChange={(e) => setLoanTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter"}
                        className={`${inputClassName} mt-2`}
                        placeholder="Enter your Loan Title"
                    />
                </label>

                <label className="block">
                    <span className={labelClassName}>Jumlah yang Diajukan (Rp) *</span>
                    <input
                        value={requestedAmountInput}
                        onChange={(e) => handleRequestedAmountChange(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter"}
                        inputMode="numeric"
                        className={`${inputClassName} mt-2`}
                        placeholder="e.g., 5000000"
                    />
                </label>

                {/* Fixed Installment Frequency */}
                <label className="block">
                    <span className={labelClassName}>
                        Atur Frekuensi Cicilan (dalam satuan Bulan) * <span className="text-slate-400 font-normal"> (Min 3 bulan, Max 6 bulan)</span>
                    </span>
                    <input
                        value={installment_freq}
                        onChange={(e) => handleInstallmentFreqChange(e.target.value)}
                        onBlur={handleInstallmentBlur} // Auto-corrects value when user clicks away
                        type="number"
                        min={3}
                        max={6}
                        inputMode="numeric"
                        className={`${inputClassName} mt-2 ${
                            installmentFreqInput !== "" && (Number(installmentFreqInput) < 3 || Number(installmentFreqInput) > 6)
                                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                                : ""
                        }`}
                        placeholder="e.g., 4"
                    />
                </label>

                <label className="block">
                    <span className={labelClassName}>Tujuan Pinjaman *</span>
                    <textarea
                        value={String(loan_purpose)}
                        onChange={(e) => setLoanPurpose(e.target.value)}
                        className="mt-2 min-h-32 w-full resize-none rounded-md border border-[#D8DEE8] bg-[#F3F4F6] px-3 py-3 text-[13px] text-[#111827] shadow-inner outline-none transition placeholder:text-[#7B8190] focus:border-[#FCB82E] focus:bg-white focus:ring-2 focus:ring-[#FCB82E]/20"
                        placeholder="Jelaskan mengapa Anda membutuhkan pinjaman ini dan rencana Anda dalam menggunakan pinjaman ini"
                    />
                    <span className="mt-2 block text-[11px] font-medium text-[#667085]">
                        Berikan penjelasan detail terkait pengeluaran untuk keperluan pendidikan dan kebutuhan finansial Anda
                    </span>
                </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-5 border-t border-[#E5E7EB] pt-4">
                <button
                    type="button"
                    onClick={handleBack}
                    className="h-8 rounded-md border border-[#E5E7EB] bg-white px-4 text-xs font-semibold text-[#111827] transition hover:bg-[#F8FAFC]"
                >
                    Kembali
                </button>

                <button
                    type="button"
                    onClick={handleContinue}
                    disabled={!isStepComplete}
                    className="h-8 rounded-md px-4 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:bg-[#B7D9CF] disabled:text-white/80 enabled:bg-[#009966] enabled:hover:bg-[#007A52]"
                >
                    Lanjutkan
                </button>
            </div>
        </div>
    );
}
