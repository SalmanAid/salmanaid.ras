
"use client"

import ApplicantForm_PersonalInformationSection from "@/components/ui/applicant-form/personal_information_section";
import ApplicantForm_FinancialNeedsSection from "@/components/ui/applicant-form/financial_needs_section";
import ApplicantForm_DocumentUploadSection from "@/components/ui/applicant-form/document_upload_section";
import ApplicantForm_TermsAndAgreementSection from "@/components/ui/applicant-form/terms_and_agreement_section";
import ApplicantForm_ApplicationProgressSection from "@/components/ui/applicant-form/application_progress_section";

import { useApplicationProgressStore } from "@/hooks/applicationProgressStore";
import ApplicantDashboard_ApplicantNavbar from "@/components/ui/applicant-dashboard/applicant_navbar";

export default function ApplyLoanFormPage(){

    const applicationProgress = useApplicationProgressStore((state) => (state.application_progress))

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

                <div className="grid items-start gap-7 lg:grid-cols-[304px_1fr]">
                    <aside className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
                        <div className="text-base font-bold text-[#111827]">
                            Application Progress
                        </div>
                        <ApplicantForm_ApplicationProgressSection />
                    </aside>

                    <section className="min-w-0">
                        { applicationProgress?.step == 1 && <ApplicantForm_PersonalInformationSection /> }
                        { applicationProgress?.step == 2 && <ApplicantForm_FinancialNeedsSection /> }
                        { applicationProgress?.step == 3 && <ApplicantForm_DocumentUploadSection /> }
                        { applicationProgress?.step == 4 && <ApplicantForm_TermsAndAgreementSection /> }
                    </section>
                </div>
            </main>
        </div>
    );
}
