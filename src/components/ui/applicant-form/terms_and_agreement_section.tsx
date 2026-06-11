

import { useApplicationProgressStore } from "@/hooks/applicationProgressStore"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useRoleShell } from "@/components/cms/role-shell-provider"
import { defaultBorrowerAgreement } from "@/cms/defaults"

type CreatedLoanApplicationResponse = {
    data: {
        id: string
    }
}

export default function ApplicantForm_TermsAndAgreementSection() {

    const router = useRouter()
    const shell = useRoleShell("BORROWER")
    const agreement = shell.borrowerAgreement || defaultBorrowerAgreement
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

    const handleSubmitApplication = async () => {
        if (isSubmitting) return

        const state = useApplicationProgressStore.getState()

        const {
            full_name,
            university_name,
            student_id_number,
            loan_title,
            requested_amount,
            loan_purpose,
            installment_freq,
            comply_to_terms_and_agreement
        } = state

        if (
            !full_name ||
            !university_name ||
            !student_id_number ||
            !loan_title ||
            !requested_amount ||
            !loan_purpose ||
            !installment_freq ||
            !comply_to_terms_and_agreement
        ) {
            setSubmitError("Mohon lengkapi seluruh data dan terima kesepakatan sebelum mengirim pengajuan pinjaman.")
            return
        }

        setIsSubmitting(true)
        setSubmitError(null)
        setSubmitSuccess(null)

        try {
            const createApplicationResponse = await fetch("/api/loan-applications", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    installmentFreq : installment_freq,
                    requestedAmount: requested_amount,
                    description: `${loan_title}\n\n${loan_purpose}`,
                    collateralUrl: "",
                    collateralDescription: [
                        `Nama: ${full_name}`,
                        `Universitas: ${university_name}`,
                        `NIM: ${student_id_number}`,
                    ].join("\n"),
                }),
            })

            if (!createApplicationResponse.ok) {
                const errorBody = await createApplicationResponse.json().catch(() => null)
                throw new Error(errorBody?.error || "Failed to create loan application.")
            }

            await createApplicationResponse.json() as CreatedLoanApplicationResponse

            setSubmitSuccess("Pengajuan berhasil dikirimkan.")
            router.push("/applicant/dashboard")
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Something went wrong while submitting the application.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const decrementStep = useApplicationProgressStore((state) => state.decrementStep)
    const fullName = useApplicationProgressStore((state) => state.full_name)
    const universityName = useApplicationProgressStore((state) => state.university_name)
    const studentIdNumber = useApplicationProgressStore((state) => state.student_id_number)
    const loanTitle = useApplicationProgressStore((state) => state.loan_title)
    const requestedAmount = useApplicationProgressStore((state) => state.requested_amount)
    const loanPurpose = useApplicationProgressStore((state) => state.loan_purpose)
    const complyToTermsAndAgreement = useApplicationProgressStore((state) => state.comply_to_terms_and_agreement)
    const switchComplyToTermsAndAgreement = useApplicationProgressStore((state) => state.switchComplyToTermsAndAgreement)
    const isApplicationComplete = Boolean(
        fullName?.trim() &&
        universityName?.trim() &&
        studentIdNumber?.trim() &&
        loanTitle?.trim() &&
        Number(requestedAmount) > 0 &&
        loanPurpose?.trim() &&
        complyToTermsAndAgreement
    )

    return (
        <div className="rounded-lg border border-[#E2E8F0] bg-white px-7 py-8 shadow-[0_1px_3px_rgba(15,23,42,0.08)] sm:px-8">
            <div>
                <h2 className="text-[22px] font-extrabold leading-tight text-[#111827]">
                    {agreement.sectionTitle}
                </h2>
                <p className="mt-2 text-xs font-medium text-[#667085]">
                    {agreement.sectionDescription}
                </p>
            </div>

            <div className="mt-6 max-h-86 overflow-y-auto rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-5 text-xs leading-6 text-[#334155]">
                <h3 className="text-sm font-bold text-[#111827]">
                    {agreement.agreementTitle}
                </h3>

                <p className="mt-4">
                    {agreement.introduction}
                </p>

                <p className="mt-4">
                    {agreement.explanation}
                </p>

                <ul className="mt-3 space-y-2 pl-4">
                    {agreement.terms.map((term) => <li key={term}>{term}</li>)}
                </ul>

                <p className="mt-4">
                    {agreement.hardshipText}
                </p>

                <p className="mt-3">
                    {agreement.closingText}
                </p>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-[#E2E8F0] bg-white px-3 py-4">
                <input
                    type="checkbox"
                    checked={complyToTermsAndAgreement}
                    onChange={switchComplyToTermsAndAgreement}
                    className="mt-0.5 h-4 w-4 rounded border-[#111827] accent-[#111827]"
                />
                <span className="text-xs font-semibold leading-6 text-[#111827]">
                    {agreement.checkboxLabel}
                </span>
            </label>

            {(submitError || submitSuccess) && (
                <div className={`mt-5 rounded-lg px-4 py-3 text-sm ${submitError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {submitError || submitSuccess}
                </div>
            )}

            <div className="mt-7 flex justify-end gap-5 border-t border-[#E5E7EB] pt-3">
                <button
                    type="button"
                    onClick={decrementStep}
                    className="h-8 rounded-md border border-[#E5E7EB] bg-white px-4 text-xs font-semibold text-[#111827] transition hover:bg-[#F8FAFC]"
                >
                    Kembali
                </button>

                <button
                    type="button"
                    onClick={handleSubmitApplication}
                    disabled={isSubmitting || !isApplicationComplete}
                    className="h-8 rounded-md px-6 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:bg-[#B7D9CF] disabled:text-white/80 enabled:bg-[#009966] enabled:hover:bg-[#007A52]"
                >
                    {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
                </button>
            </div>
        </div>
    )
}
