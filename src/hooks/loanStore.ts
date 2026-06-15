import { create } from "zustand"
import { Loan } from "@/types/loan"
import { LoanStatus } from "@/generated/prisma"

type LoanStore = {
    loans: Loan[]
    selected_loan: Loan 
    isManualSettlementCardOpen : boolean

    setLoans: (loans: Loan[]) => void
    setSelectedLoan: (loan: Loan) => void
    setApprovedAmount: (amount: number) => void
    setIsManualSettlementCardOpen : (isModalOpen : boolean) => void
}

export const useLoanStore = create<LoanStore>((set) => ({
    loans: [],
    selected_loan: {
        id: "",
        status : LoanStatus.FORGIVEN,
        dueDate : "",
        approvedAmount: 0,
        approvedAt : "",
        forgivenAmount : 0,
        forgivenAt : null,
        
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
        totalPaid : 0,
    },
    isManualSettlementCardOpen : false,

    setLoans: (loans) => set({ loans }),

    setSelectedLoan: (loan) => set({ selected_loan: loan }),

    setApprovedAmount: (amount) => 
        set((state) => ({
            selected_loan: {
                ...state.selected_loan, 
                approvedAmount: amount  
            }
        })),

    setIsManualSettlementCardOpen : (isModalOpen) => {
        set( {isManualSettlementCardOpen :  isModalOpen})
    }
}))
