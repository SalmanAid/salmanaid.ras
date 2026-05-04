"use client"

import Image from "next/image";

import WhiteChecklist from "../../../../public/white-checklist.svg"
import { useState, use } from "react";
import { useUserStore } from "@/hooks/userStore";
import { useRepaymentStore } from "@/hooks/repaymentStore";
import { PaymentMethod, TransactionType, VABank } from "@/types/donation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ApplicantDashboard_ApplicantNavbar from "./applicant_navbar";

interface PaymentModalProps {
  type?: 'donation' | 'repayment';
  referenceId?: string;
  onClose?: () => void;
}

const REPAYMENT_STEPS = [
  { id: 1, label: 'Select Amount' },
  { id: 2, label: 'Payment' },
  { id: 3, label: 'Confirmation' },
] as const;

const formatIdr = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    })
    .format(value)
    .replace('Rp', 'Rp ');

const QUICK_AMOUNTS = [50000, 100000, 250000, 500000];
    
// this function is to do repayment for borrower to the system
export default function ApplicantDashboard_PaymentApplicantComponent({
  searchParams
}: {
  searchParams: Promise<{ type?: 'donation' | 'repayment'; referenceId?: string }>;
}) {

    // do post to the repayment table and do check if the loan is finished or not

    const router = useRouter();
    const { data: session, status } = useSession();
    const params = use(searchParams);
    const paymentMethod = useRepaymentStore((state) => (state.repayment?.payment_method))
    const vaBank = useRepaymentStore((state) => (state.repayment?.va_bank))
    const amount = useRepaymentStore((state) => (state.repayment?.amount))
    const setAmount = useRepaymentStore((state) => (state.setAmount))
    const setPaymentMethod = useRepaymentStore((state) => (state.setPaymentMethod))
    const setVaBank = useRepaymentStore((state) => (state.setVABank))
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    
    const transactionType: TransactionType = (params.type as TransactionType) || 'repayment';
    const referenceId =
        params.referenceId || (transactionType === 'repayment' ? session?.user?.id || '' : '');
    
    const handlePaymentMethodSelect = (method: PaymentMethod) => {
        setPaymentMethod(String(method));
        setError('');
    };
    
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(Number(e.target.value));
        setError('');
    };
    
    const handleSubmit = async () => {
        setError('');
    
        if (!paymentMethod) {
        setError('Please select a payment method');
        return;
        }
    
        if (!amount || parseFloat(String(amount)) <= 0) {
        setError('Please enter a valid amount');
        return;
        }
    
        if (paymentMethod === 'qris' && parseFloat(String(amount)) < 1500) {
        setError('Minimum QRIS amount is IDR 1,500');
        return;
        }
    
        if (!referenceId) {
        setError('Reference ID is missing');
        return;
        }
    
        setLoading(true);
    
        try {
        const response = await fetch('/api/payments/midtrans/payments', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            amount: parseFloat(String(amount)),
            transactionType,
            referenceId,
            paymentMethod,
            vaBank: paymentMethod === 'va' ? vaBank : undefined,
            description: `${transactionType === 'donation' ? 'Donation via' : 'Loan Repayment via'} ${
                paymentMethod === 'qris' ? 'QRIS' : 'Virtual Account'
            }`,
            }),
        });
    
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create payment');
        }
    
        const data = await response.json();
    
        // Redirect to confirmation page
        const redirectUrl = new URLSearchParams({
            transactionId: data.transactionId,
            orderId: data.orderId,
            amount: String(amount),
            transactionType: transactionType,
            paymentMethod: paymentMethod,
            qrCodeUrl: data.qrCodeUrl || '',
            vaNumber: data.vaNumber || '',
            bankCode: data.bankCode || '',
            billerCode: data.billerCode || '',
            billKey: data.billKey || '',
            expiryTime: data.expiryTime || '',
        }).toString();
    
        router.push(`/payment/confirm?${redirectUrl}`);
        } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
        setLoading(false);
        }
    };

    const activeStep = 1;

    return (

    <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-[#F3F5F7] shadow-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

        <main className="mx-auto w-full px-4 py-6 sm:px-6">
            <div className="text-center">
            <h1 className="text-2xl font-bold leading-tight text-[#111827] md:text-3xl">
                Make a <span className="text-[#07B0C8]">Repayment</span>
            </h1>
            <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-[#6B7280] md:text-[13px]">
                Tanggung jawab Anda meringankan beban kami dalam membantu orang lain yang juga membutuhkan.
            </p>
            </div>

            {/* main content container */}
            <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
            
            {/* repayment progress */}
            <div className="mb-6">
                <div className="relative grid grid-cols-3">
                <div className="absolute left-[16.67%] right-[16.67%] top-3.5 h-px bg-[#DCE3EA]" />

                {REPAYMENT_STEPS.map((step) => {
                    const isActive = step.id === activeStep;

                    return (
                    <div key={step.id} className="relative z-10 flex flex-col items-center gap-1.5">
                        <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-[14px] font-semibold ${
                            isActive 
                            ? 'bg-[#07B0C8] text-white shadow-md' 
                            : 'border border-[#DCE3EA] bg-[#EEF3F7] text-[#9CA9BA]'
                        }`}
                        >
                        {step.id}
                        </div>
                        <p
                        className={`text-center text-[12px] ${
                            isActive ? 'font-semibold text-[#07B0C8]' : 'font-normal text-[#8FA0B6]'
                        }`}
                        >
                        {step.label}
                        </p>
                    </div>
                    );
                })}
                </div>
            </div>

            {/* Missing Reference ID Warning */}
            {!referenceId && status !== 'loading' && (
                <div className="mb-5 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <p className="text-[12px] leading-snug text-yellow-900">
                    <span className="font-semibold">
                    {transactionType === 'repayment'
                        ? 'Unable to determine the donor account.'
                        : 'No reference ID found.'}
                    </span>
                    {transactionType === 'repayment'
                    ? ' Please sign in again before continuing.'
                    : ' This payment still needs a repayment reference ID.'}
                </p>
                </div>
            )}

            {/* select amount section */}
            <div className="space-y-3">
                <div className='flex items-center justify-between'>
                <div className='text-[13px] font-semibold text-gray-700'>
                    Pilih jumlah yang diinginkan
                </div>
                <div className='text-[11px] font-bold tracking-wider text-gray-400'>
                    IDR
                </div>
                </div>

                {/* instant choices section */}
                <div className='grid grid-cols-2 gap-2'>
                {QUICK_AMOUNTS.map((quickAmount) => {
                    const isSelected = amount === quickAmount;

                    return (
                    <button
                        key={quickAmount}
                        type="button"
                        onClick={() => setAmount(quickAmount)}
                        className={`rounded-lg border py-2 text-[12px] font-medium transition ${
                        isSelected 
                            ? 'border-[#07B0C8] bg-[#07B0C8]/10 text-[#06A3B9]' 
                            : 'border-gray-200 text-gray-600 hover:border-[#07B0C8]/45 hover:bg-[#F0FBFD]'
                        }`}
                    >
                        {formatIdr(quickAmount)}
                    </button>
                    );
                })}
                </div>

                {/* manual input section */}
                <div className="mb-4">
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                    Custom Amount
                </label>
                <div className="relative">
                    <input
                    type="number"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0"
                    min={paymentMethod === 'qris' ? '1500' : '1000'}
                    step="1000"
                    className="w-full px-3 py-2 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#07B0C8]/50 transition-all"
                    disabled={!paymentMethod}
                    />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 italic">
                    Min: {paymentMethod === 'qris' ? 'IDR 1,500' : 'IDR 1,000'}
                </p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-2.5 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-red-600 text-[11px] font-medium">{error}</p>
                </div>
            )}

            {/* Payment Method Selection */}
            <div className="mb-5">
                <label className="block text-[12px] font-semibold text-gray-700 mb-2">
                Payment Method
                </label>

                {/* QRIS Option */}
                <div
                onClick={() => handlePaymentMethodSelect('qris')}
                className={`mb-2 p-3 border rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'qris'
                    ? 'border-[#07B0C8] bg-[#07B0C8]/5 shadow-sm'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
                >
                <div className="flex items-center">
                    <div
                    className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${
                        paymentMethod === 'qris' ? 'border-[#07B0C8] bg-[#07B0C8]' : 'border-gray-300'
                    }`}
                    >
                    {paymentMethod === 'qris' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <div>
                    <p className="text-[13px] font-semibold text-gray-900">QRIS (Any E-Wallet)</p>
                    <p className="text-[10px] text-gray-500">GoPay, OVO, Dana, LinkAja</p>
                    </div>
                </div>
                </div>

                {/* Bank Transfer Option */}
                <div
                onClick={() => handlePaymentMethodSelect('va')}
                className={`p-3 border rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'va'
                    ? 'border-[#07B0C8] bg-[#07B0C8]/5 shadow-sm'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
                >
                <div className="flex items-center">
                    <div
                    className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${
                        paymentMethod === 'va' ? 'border-[#07B0C8] bg-[#07B0C8]' : 'border-gray-300'
                    }`}
                    >
                    {paymentMethod === 'va' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <div>
                    <p className="text-[13px] font-semibold text-gray-900">Virtual Account (VA)</p>
                    <p className="text-[10px] text-gray-500">Transfer bank via Midtrans</p>
                    </div>
                </div>
                </div>
            </div>

            {paymentMethod === 'va' && (
                <div className="mb-5">
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Select Bank</label>
                <select
                    value={vaBank}
                    onChange={(e) => setVaBank(e.target.value as VABank)}
                    className="w-full px-3 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#07B0C8]/50"
                >
                    <option value="bca">BCA</option>
                    <option value="bri">BRI</option>
                    <option value="bni">BNI</option>
                    <option value="permata">Permata</option>
                    <option value="cimb">CIMB</option>
                    <option value="mandiri_bill">Mandiri Bill</option>
                </select>
                </div>
            )}

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={loading || !paymentMethod || !amount || !referenceId}
                className={`w-full py-2.5 rounded-xl text-[14px] font-bold text-white shadow-md transition-all active:scale-[0.98] ${
                loading || !paymentMethod || !amount || !referenceId
                    ? 'bg-gray-300 cursor-not-allowed shadow-none'
                    : 'bg-[#07B0C8] hover:bg-[#059BB0]'
                }`}
            >
                {loading ? 'Processing...' : 'Continue to Payment'}
            </button>

            </div>
        </main>
    </div>
  );    
}