import { FileText } from "lucide-react";

import { useApplicationProgressStore } from "@/hooks/applicationProgressStore";

import ApplicantForm_FamilyCardUploadBlock from "./family_card_upload_block";
import ApplicantForm_StudentIdCardUploadBlock from "./student_id_card_upload_block";

export default function ApplicantForm_DocumentUploadSection() {
    const studentIdCard = useApplicationProgressStore((state) => state.student_id_card);
    const familyCard = useApplicationProgressStore((state) => state.family_card);
    const incrementStep = useApplicationProgressStore((state) => state.incrementStep);
    const decrementStep = useApplicationProgressStore((state) => state.decrementStep);
    const isStepComplete = Boolean(studentIdCard && familyCard);

    const handleBack = async () => {
        decrementStep();
    };

    const handleContinue = async () => {
        if (!isStepComplete) return;
        incrementStep();
    };

    return (
        <div className="rounded-lg border border-[#E2E8F0] bg-white px-7 py-8 shadow-[0_1px_3px_rgba(15,23,42,0.08)] sm:px-8">
            <div>
                <h2 className="text-[22px] font-extrabold leading-tight text-[#111827]">
                    Unggah Dokumen
                </h2>
                <p className="mt-2 text-xs font-medium text-[#667085]">
                    Mohon unggah dokumen yang diperlukan untuk memverifikasi identitas Anda
                </p>
            </div>

            <div className="mt-6 space-y-6">
                <div>
                    <div className="text-xs font-semibold text-[#111827]">
                        Nomor Induk Mahasiswa (KTM) *
                    </div>
                    <div className="mt-2">
                        <ApplicantForm_StudentIdCardUploadBlock />
                    </div>
                </div>

                <div>
                    <div className="text-xs font-semibold text-[#111827]">
                        Kartu Keluarga (KK) *
                    </div>
                    <div className="mt-2">
                        <ApplicantForm_FamilyCardUploadBlock />
                    </div>
                </div>

                <div className="rounded-lg border border-[#FCD34D] bg-[#FFFBEB] px-4 py-4 text-[#A65F00]">
                    <div className="flex gap-3">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#F59E0B]" strokeWidth={2.2} />
                        <div>
                            <div className="text-xs font-bold">Kelengkapan Dokumen</div>
                            <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] font-medium">
                                <li>Dokumen harus dalam format JPG, PNG, atau PDF format</li>
                                <li>Maximum ukuran dokumen: 5MB per dokumen</li>
                                <li>Dokumen harus jelas dan dapat dibaca</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-7 flex items-center justify-end gap-5 border-t border-[#E5E7EB] pt-3">
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
