import { create } from "zustand"
import { LoanApplication } from "@/types/loan_application"

type LoanStore = {
    loans: LoanApplication[]
    selected_loan: LoanApplication 

    setLoans: (loans: LoanApplication[]) => void
    setSelectedLoan: (loan: LoanApplication) => void
    setApprovedAmount: (amount: number) => void
    setRejectionApprovalNote: (note: string) => void
}

export const useLoanStore = create<LoanStore>((set) => ({
    loans: [],
    selected_loan: {
        id: "",
        loanApplicationId: "",
        name: "",
        idNumber: "",
        institution: "",
        image: "",
        intakeYear: 2026,
        address: "",

        // loan details
        requestedAmount: 0,
        description: "",
        collateralDescription: "",
        status: "",
        createdAt: 0,
        loanId: "",
        loan: null,
        attachments: [],
        studentIdCard: "",
        transcriptFile: "",

        // admin actions
        approvedAmount: 0,
        rejectionApprovalNotes: ""
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

    setRejectionApprovalNote: (note) => 
        set((state) => ({
            selected_loan: {
                ...state.selected_loan,
                rejectionApprovalNotes: note
            }
        })),

}))
