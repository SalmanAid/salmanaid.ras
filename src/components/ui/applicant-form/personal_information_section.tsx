
import { useApplicationProgressStore } from "@/hooks/applicationProgressStore";

export default function ApplicantForm_PersonalInformationSection() {

    const applicationProgress = useApplicationProgressStore((state) => (state.application_progress))
    const full_name = useApplicationProgressStore((state) => (state.full_name))
    const university_name = useApplicationProgressStore((state) => (state.university_name))
    const student_id_number = useApplicationProgressStore((state) => (state.student_id_number))

    const setFullName = useApplicationProgressStore((state) => (state.setFullName))
    const setUniversityName = useApplicationProgressStore((state) => (state.setUniversityName))
    const setStudentIdNumber = useApplicationProgressStore((state) => (state.setStudentIdNumber))

    const incrementStep = useApplicationProgressStore((state) => state.incrementStep)
    const decrementStep = useApplicationProgressStore((state) => state.decrementStep)

    const handleBack = async () => {
        decrementStep()
    }

    const handleContinue = async () => {
        incrementStep()
    }

    const inputClassName = "h-8 w-full rounded-md border border-[#D8DEE8] bg-[#F3F4F6] px-3 text-[13px] text-[#111827] shadow-inner outline-none transition placeholder:text-[#7B8190] focus:border-[#FCB82E] focus:bg-white focus:ring-2 focus:ring-[#FCB82E]/20"
    const labelClassName = "text-xs font-semibold text-[#111827]"
    
    return (
        <div className="rounded-lg border border-[#E2E8F0] bg-white px-7 py-8 shadow-[0_1px_3px_rgba(15,23,42,0.08)] sm:px-8">
            <div>
                <h2 className="text-[22px] font-extrabold leading-tight text-[#111827]">
                    Personal Information
                </h2>
                <p className="mt-2 text-xs font-medium text-[#667085]">
                    Please provide your basic information as a student
                </p>
            </div>

            <div className="mt-6 space-y-4">
                <label className="block">
                    <span className={labelClassName}>Full Name *</span>
                    <input
                        value={String(full_name)}
                        onChange={(e) => setFullName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter"}
                        className={`${inputClassName} mt-2`}
                        placeholder="Enter your full name"
                    />
                </label>

                <label className="block">
                    <span className={labelClassName}>University *</span>
                    <input
                        value={String(university_name)}
                        onChange={(e) => setUniversityName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter"}
                        className={`${inputClassName} mt-2`}
                        placeholder="Enter your university name"
                    />
                </label>

                <label className="block">
                    <span className={labelClassName}>Student ID Number *</span>
                    <input
                        value={String(student_id_number)}
                        onChange={(e) => setStudentIdNumber(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter"}
                        className={`${inputClassName} mt-2`}
                        placeholder="Enter your student ID"
                    />
                </label>
            </div>

            <div className="mt-7 flex items-center justify-end gap-5 border-t border-[#E5E7EB] pt-3">
                <button
                    type="button"
                    onClick={handleBack}
                    disabled={Number(applicationProgress?.step ?? 1) <= 1}
                    className="h-8 rounded-md border border-[#E5E7EB] bg-white px-4 text-xs font-semibold text-[#8A8F98] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Back
                </button>

                <button
                    type="button"
                    onClick={handleContinue}
                    className="h-8 rounded-md bg-[#74CDB4] px-4 text-xs font-bold text-white transition hover:bg-[#56B99D]"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
