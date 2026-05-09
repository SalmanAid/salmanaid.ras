
"use client"

export default function ApplicantDashboard_PaymentScheduleRow(props : {installment_value : number, installment_date : Date, installment_order : number, installment_status : string}){

    // fetch conditions from the db
    const installmentStatusColor : any = {
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

        // main container
        <div className="flex justify-center items-center h-full w-full">
            
            {/* symbol */}
            <div className="flex justify-center items-center w-8">
                <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: `#${installmentStatusColor[props.installment_status]['text-hex']}` }}
                />
            </div>

            {/* content : date, installment, and status */}
            <div className="flex flex-col h-fit w-[65%] p-2">

                {/* date */}
                <div className="flex justify-start items-start p-0.5">
                    {props.installment_date.toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                    })}
                </div>

                {/* installment */}
                <div className="flex justify-start items-start p-0.5">
                    Cicilan #{props.installment_order}
                </div>

                {/* status */}
                <div className={`flex w-fit rounded-2xl p-2 justify-start items-start font-semibold text-sm`}
                    style={{ background : `#${installmentStatusColor[props.installment_status]['bg-hex']}` ,
                            color : `#${installmentStatusColor[props.installment_status]['text-hex']}`
                    }}
                >
                    {statusLabel}
                </div>

            </div>

            {/* value of payment */}
            <div className="flex h-fit w-[25%] justify-end items-center">
                Rp {props.installment_value.toString()}
            </div>

        </div>
    );
}