
"use client"

export default function ApplicantDashboard_PaymentScheduleRow(props : {installment_value : number, installment_date : Date, installment_order : number, installment_status : string}){

    const installmentStatusColor: Record<string, { "bg-hex": string; "text-hex": string }> = {
        "paid" : {
            "bg-hex" : "D0FAE5",
            "text-hex" : "006045"
        },
        "due_soon" : {
            "bg-hex" : "FEF9C2",
            "text-hex" : "894B00"
        },
        "pending" : {
            "bg-hex" : "F3F4F6",
            "text-hex" : "1E2939"
        },
        "past_due" : {
            "bg-hex" : "FEE2E2",
            "text-hex" : "B91C1C"
        }
    }

    const statusLabelMap : Record<string, string> = {
        paid: "Lunas",
        due_soon: "Jatuh tempo dekat",
        pending: "Belum jatuh tempo",
        past_due: "Terlambat",
    };
    const statusLabel = statusLabelMap[props.installment_status] || props.installment_status;

    return (
        <div className="flex w-full items-center gap-3 border-b border-[#EEF2F6] py-3 last:border-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: `#${installmentStatusColor[props.installment_status]['text-hex']}` }}
                />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[#111827]">
                    {props.installment_date.toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                    })}
                </p>
                <p className="mt-0.5 text-[12px] text-[#6B7280]">
                    Cicilan #{props.installment_order}
                </p>
                <span
                    className="mt-2 inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none"
                    style={{ background : `#${installmentStatusColor[props.installment_status]['bg-hex']}` ,
                            color : `#${installmentStatusColor[props.installment_status]['text-hex']}`
                    }}
                >
                    {statusLabel}
                </span>
            </div>

            <p className="shrink-0 text-right text-[13px] font-semibold text-[#111827]">
                {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                }).format(props.installment_value)}
            </p>
        </div>
    );
}
