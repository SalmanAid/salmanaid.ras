
import Image from "next/image";

import WhiteChecklist from "../../../../public/white-checklist.svg"
import AlertLogo from "../../../../public/alert.svg"
import GrayDotLogo from "../../../../public/gray-dot.svg"

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
                bg: "#009966",
                icon: WhiteChecklist,
                alt: "Selesai",
            };
        case "rejected":
            return {
                bg: "#EF4444",
                icon: AlertLogo,
                alt: "Ditolak",
            };
        default:
            return {
                bg: "#E5E7EB",
                icon: GrayDotLogo,
                alt: "Menunggu",
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

    return (

        // main container
        <div className="flex flex-col w-full h-full justify-center items-start gap-2 p-2">
            
            {/* title */}
            <div className="flex justify-start items-center w-full h-fit px-2 pt-2 font-semibold text-lg">
                Progres Pengajuan
            </div>

            {/* progress */}
            <div className="flex flex-col justify-center items-center gap-2">

                {/* submitted section */}
                <div className="flex w-full h-fit justify-start items-center">
                    
                    {/* symbols */}
                    {(() => {
                        const visual = getStepVisual(submittedState);
                        return (
                            <div
                                className="flex justify-center items-center rounded-full p-2 w-[10%]"
                                style={{ background: visual.bg }}
                            >
                                <Image src={visual.icon} alt={visual.alt} />
                            </div>
                        );
                    })()}

                    {/* title + caption + date */}
                    <div className="flex flex-col justify-center items-start w-[90%] p-2">
                        
                        {/* title */}
                        <div className="text-lg font-semibold">
                            Pengajuan Dikirim
                        </div>

                        {/* caption */}
                        <div className="font-light">
                            Pengajuan Anda sudah diterima
                        </div>

                        {/* date */}
                        <div className="text-sm font-light opacity-80">
                            {renderStatusLine(submittedState, props.submitTime)}
                        </div>

                    </div>

                </div>

                {/* verified section */}
                <div className="flex w-full h-fit justify-between items-center">
                    
                    {/* symbols */}
                    {(() => {
                        const visual = getStepVisual(verifiedState);
                        return (
                            <div
                                className="flex justify-center items-center rounded-full p-2 w-[10%]"
                                style={{ background: visual.bg }}
                            >
                                <Image src={visual.icon} alt={visual.alt} />
                            </div>
                        );
                    })()}

                    {/* title + caption + date */}
                    <div className="flex flex-col justify-center items-start w-[90%] p-2">
                        
                        {/* title */}
                        <div className="text-lg font-semibold">
                            Verifikasi
                        </div>

                        {/* caption */}
                        <div className="font-light">
                            Dokumen dan informasi terverifikasi
                        </div>

                        {/* date */}
                        <div className="text-sm font-light opacity-80">
                            {renderStatusLine(verifiedState, props.verifiedTime)}
                        </div>

                    </div>

                </div>

                {/* disbursed section */}
                <div className="flex w-full h-fit justify-between items-center">
                    
                    {/* symbols */}
                    {(() => {
                        const visual = getStepVisual(disbursedState);
                        return (
                            <div
                                className="flex justify-center items-center rounded-full p-2 w-[10%]"
                                style={{ background: visual.bg }}
                            >
                                <Image src={visual.icon} alt={visual.alt} />
                            </div>
                        );
                    })()}

                    {/* title + caption + date */}
                    <div className="flex flex-col justify-center items-start w-[90%] p-2">
                        
                        {/* title */}
                        <div className="text-lg font-semibold">
                            Dana Disalurkan
                        </div>

                        {/* caption */}
                        <div className="font-light">
                            Dana sudah dikirim ke rekening Anda
                        </div>

                        {/* date */}
                        <div className="text-sm font-light opacity-80">
                            {renderStatusLine(disbursedState, props.disbursedTime)}
                        </div>

                    </div>

                </div>

            </div>

            {/* view details + download contracts section */}
            <div className="flex justify-between items-center w-full h-fit p-2 gap-4">

                {/* view details */}
                <div className="flex justify-center items-center w-1/2 h-fit text-white bg-[#07B0C8] rounded-lg p-2">
                    Lihat Detail
                </div>

                {/* download contracts */}
                <div className="flex justify-center items-center w-1/2 h-fit text-[#07B0C8] border-2 border-[#07B0C8] rounded-lg font-semibold p-2">
                    Unduh Kontrak
                </div>
            </div>

        </div>
    );
}