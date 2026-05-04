import { LoanStatus } from "@/generated/prisma"
import { string } from "zod"


export type Loan = {
    id : string,
    approvedAmount:Number,
    status:LoanStatus,
    approvedAt : string | number | Date,
    dueDate : string | number | Date,
    application: {
        description : string,
        borrower : {
            name : string,
            email : string
        }
    },
    _count : {
        repayments : number
    }
}