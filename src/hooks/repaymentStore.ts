

import { create } from "zustand"
import { Donation } from "@/types/donation"

type RepaymentStore = {
    repayment: Donation
    step : number

    setAmount: (amount: number) => void
    setPaymentMethod: (payment_method: string) => void
    setVABank: (va_bank: string) => void
}

export const useRepaymentStore= create<RepaymentStore>((set) => ({
    repayment: {
        amount: 0,
        payment_method: "",
        va_bank: ""
    },
    step : 1,

    setAmount: (amount) =>
        set((state) => ({
            repayment: {
                ...state.repayment,
                amount,
            }
        })),

    setPaymentMethod: (payment_method) =>
        set((state) => ({
            repayment: {
                ...state.repayment,
                payment_method,
            },
        })),

    setVABank: (va_bank) =>
        set((state) => ({
            repayment: {
                ...state.repayment,
                va_bank,
            },
        })),
}))