import { Check, Circle, X } from "lucide-react";

type ProgressProps = {
    submitTime: Date | null;
    verifiedTime: Date | null;
    disbursedTime: Date | null;
    applicationStatus: string | null;
    loanStatus: string | null;
};

type StepState = "complete" | "pending" | "rejected";

const formatDate = (value: Date | null) => {
    if (!value) return null;
    return value.toLocaleDateString("id-ID", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
};

const getStepVisual = (state: StepState) => {
    switch (state) {
        case "complete":
            return {
                circleClassName: "bg-[#009966] text-white",
                lineClassName: "bg-[#009966]",
                icon: Check,
            };
        case "rejected":
            return {
                circleClassName: "bg-[#EF4444] text-white",
                lineClassName: "bg-[#EF4444]",
                icon: X,
            };
        default:
            return {
                circleClassName: "bg-[#E5E7EB] text-[#9CA3AF]",
                lineClassName: "bg-[#E5E7EB]",
                icon: Circle,
            };
    }
};

const renderStatusLine = (state: StepState, date: Date | null) => {
    if (state === "rejected") {
        return "Ditolak";
    }

    if (state === "pending") {
        return "Menunggu";
    }

    const formatted = formatDate(date);
    return formatted ? `Selesai pada ${formatted}` : "Selesai";
};

export default function ApplicantDashboard_ApplicationProgressComponent(props: ProgressProps){
    const applicationStatus = props.applicationStatus;
    const loanStatus = props.loanStatus;

    const submittedState: StepState = props.submitTime ? "complete" : "pending";
    const verifiedState: StepState = applicationStatus === "REJECTED"
        ? "rejected"
        : applicationStatus === "APPROVED"
            ? "complete"
            : "pending";
    const disbursedState: StepState = applicationStatus === "REJECTED"
        ? "rejected"
        : loanStatus === "ACTIVE" || loanStatus === "PAID"
            ? "complete"
            : "pending";

    const steps = [
        {
            title: "Pengajuan Dikirim",
            caption: "Pengajuan Anda sudah diterima",
            date: props.submitTime,
            state: submittedState,
        },
        {
            title: "Verifikasi",
            caption: "Dokumen dan informasi terverifikasi",
            date: props.verifiedTime,
            state: verifiedState,
        },
        {
            title: "Dana Disalurkan",
            caption: "Dana sudah dikirim ke rekening Anda",
            date: props.disbursedTime,
            state: disbursedState,
        },
    ];

    return (
        <div className="h-full rounded-xl border border-gray-200 bg-white p-4 shadow-[0_3px_10px_-8px_rgba(17,24,39,0.18)] md:p-5">
            <h2 className="text-lg font-bold text-[#111827]">Progres Pengajuan</h2>

            <div className="mt-5 space-y-0">
                {steps.map((step, index) => {
                    const visual = getStepVisual(step.state);
                    const Icon = visual.icon;
                    const isLast = index === steps.length - 1;

                    return (
                        <div key={step.title} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3">
                            <div className="relative flex justify-center">
                                <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${visual.circleClassName}`}>
                                    <Icon className="h-4 w-4" strokeWidth={2.5} />
                                </div>
                                {!isLast && (
                                    <div
                                        className={`absolute top-8 h-[calc(100%-2rem)] w-px ${visual.lineClassName}`}
                                        aria-hidden="true"
                                    />
                                )}
                            </div>

                            <div className={`${isLast ? "pb-0" : "pb-8"}`}>
                                <p className="text-base font-bold leading-tight text-[#111827]">
                                    {step.title}
                                </p>
                                <p className="mt-1 text-[13px] leading-5 text-[#374151]">
                                    {step.caption}
                                </p>
                                <p className="mt-1 text-[12px] leading-5 text-[#6B7280]">
                                    {renderStatusLine(step.state, step.date)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-[#07B0C8] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#069db3]"
                >
                    Lihat Detail
                </button>
                <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-[#B7DCE4] bg-white px-4 text-[13px] font-semibold text-[#07B0C8] transition-colors hover:border-[#07B0C8] hover:bg-[#F0FBFD]"
                >
                    Unduh Kontrak
                </button>
            </div>
        </div>
    );
}
