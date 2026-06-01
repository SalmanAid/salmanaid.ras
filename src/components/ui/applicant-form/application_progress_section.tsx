
import { Check } from "lucide-react";

import { useApplicationProgressStore } from "@/hooks/applicationProgressStore";

const steps = [
    {
        number: 1,
        title: "Informasi Pribadi",
        description: "Informasi dasar",
    },
    {
        number: 2,
        title: "Kebutuhan Finansial",
        description: "Detail pinjaman",
    },
    {
        number: 3,
        title: "Kesepakatan",
        description: "Syarat dan Ketentuan",
    },
];

export default function ApplicantForm_ApplicationProgressSection() {

    const applicationProgress = useApplicationProgressStore((state) => (state.application_progress))
    const activeStep = Number(applicationProgress?.step ?? 1)

    return (
        <div className="mt-5 flex w-full flex-col">
            {steps.map((step, index) => {
                const isCompleted = activeStep > step.number;
                const isActive = activeStep === step.number;
                const markerClassName = isCompleted
                    ? "border-[#A7F3D0] bg-[#D1FAE5] text-[#059669]"
                    : isActive
                        ? "border-[#FCB82E] bg-[#FCB82E] text-white"
                        : "border-[#F1F5F9] bg-[#F1F5F9] text-[#94A3B8]";

                return (
                    <div key={step.number} className="relative flex min-h-19 gap-3">
                        {index < steps.length - 1 && (
                            <div
                                className={`absolute left-3.5 top-7 h-3 w-px ${
                                    isCompleted ? "bg-[#BFF7DD]" : "bg-[#E5E7EB]"
                                }`}
                            />
                        )}

                        <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${markerClassName}`}>
                                {isCompleted ? <Check size={15} strokeWidth={3} /> : step.number}
                            </div>
                        </div>

                        <div className="pb-5 pt-1">
                            <div className={`text-sm font-bold ${isActive || isCompleted ? "text-[#111827]" : "text-[#94A3B8]"}`}>
                                {step.title}
                            </div>
                            <div className={`mt-1 text-xs font-medium ${isActive || isCompleted ? "text-[#667085]" : "text-[#94A3B8]"}`}>
                                {step.description}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
