import { create } from "zustand"
import { Loan } from "@/types/loan"
import { LoanStatus } from "@/generated/prisma"

type LoanStore = {
    loans: Loan[]
    selected_loan: Loan 

    setLoans: (loans: Loan[]) => void
    setSelectedLoan: (loan: Loan) => void
    setApprovedAmount: (amount: number) => void
}

export const useLoanStore = create<LoanStore>((set) => ({
    loans: [],
    selected_loan: {
        id: "",
        status : LoanStatus.FORGIVEN,
        dueDate : "",
        approvedAmount: 0,
        approvedAt : "",
        
        // loan details
        application: {
            description : "",
            borrower : {
                name : "",
                email : ""
            }
        },
        _count: {
            repayments : 0
        },
    },

    setLoans: (loans) => set({ loans }),

    setSelectedLoan: (loan) => set({ selected_loan: loan }),

    setApprovedAmount: (amount) => 
        set((state) => ({
            selected_loan: {
                ...state.selected_loan, 
                approvedAmount: amount  
            }
        })),

}))
