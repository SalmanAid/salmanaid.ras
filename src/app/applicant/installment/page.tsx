"use client";

import { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import ApplicantDashboard_ApplicantNavbar from "@/components/ui/applicant-dashboard/applicant_navbar";
import { useRepaymentStore } from "@/hooks/repaymentStore";
import { useUserStore } from "@/hooks/userStore";
import { PaymentMethod, TransactionType, VABank } from "@/types/donation";

const REPAYMENT_STEPS = [
	{ id: 1, label: "Select Loan" },
	{ id: 2, label: "Select Amount" },
	{ id: 3, label: "Payment" },
	{ id: 4, label: "Confirmation" },
] as const;

const formatIdr = (value: number) =>
	new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	})
		.format(value)
		.replace("Rp", "Rp ");

const QUICK_AMOUNTS = [50000, 100000, 250000, 500000];

type InstallmentPageProps = {
	searchParams?: Promise<{ type?: "donation" | "repayment"; referenceId?: string }>;
};

type LoanOption = {
	id: string;
	description?: string | null;
	status?: string | null;
	loanDetails?: { approvedAmount?: number | string };
	requestedAmount?: number | string;
	dueDate?: string | null;
};

export default function InstallmentPage({ searchParams }: InstallmentPageProps) {
	const router = useRouter();
	const { data: session, status } = useSession();
	const params = use(searchParams ?? Promise.resolve({}));
	const userId = useUserStore((state) => state.user?.id) || (session?.user as { id?: string } | null)?.id;

	const paymentMethod = useRepaymentStore((state) => state.repayment?.payment_method);
	const vaBank = useRepaymentStore((state) => state.repayment?.va_bank);
	const amount = useRepaymentStore((state) => state.repayment?.amount);
	const setAmount = useRepaymentStore((state) => state.setAmount);
	const setPaymentMethod = useRepaymentStore((state) => state.setPaymentMethod);
	const setVaBank = useRepaymentStore((state) => state.setVABank);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>("");
	const [amountInput, setAmountInput] = useState(() => (amount ? String(amount) : ""));
	const [loans, setLoans] = useState<LoanOption[]>([]);
	const [loansLoading, setLoansLoading] = useState(true);
	const [loansError, setLoansError] = useState<string>("");
	const [selectedLoanId, setSelectedLoanId] = useState<string>(params.referenceId ?? "");
	const [activeStep, setActiveStep] = useState(1);

	const transactionType: TransactionType = (params.type as TransactionType) || "repayment";
	const referenceId = params.referenceId;
	const effectiveReferenceId = selectedLoanId || referenceId;
	const canProceed = Boolean(effectiveReferenceId);
	const parsedAmount = Number(amountInput);

	useEffect(() => {
		if (status === "loading") {
			return;
		}

		if (!userId) {
			setLoans([]);
			setLoansError("Unable to load loans.");
			setLoansLoading(false);
			return;
		}

		const fetchLoans = async () => {
			setLoansLoading(true);
			setLoansError("");

			try {
				const response = await fetch(`/api/loans/${userId}`);
				if (!response.ok) {
					throw new Error("Failed to fetch loans");
				}

				const result = await response.json();
				const applications = (result?.data?.applications || []) as LoanOption[];
				const approvedLoans = applications
					.filter(
						(loan) =>
							loan.status === "APPROVED" &&
							loan.loanDetails?.loanId &&
							loan.loanDetails?.status === "ACTIVE"
					)
					.map((loan) => ({
						...loan,
						id: loan.loanDetails!.loanId,
					}));
				setLoans(approvedLoans);

				if (!selectedLoanId && approvedLoans.length > 0) {
					setSelectedLoanId(approvedLoans[0].id);
				}
			} catch (fetchError) {
				setLoansError(fetchError instanceof Error ? fetchError.message : "Failed to fetch loans");
			} finally {
				setLoansLoading(false);
			}
		};

		fetchLoans();
	}, [userId, status]);

	const handlePaymentMethodSelect = (method: PaymentMethod) => {
		setPaymentMethod(String(method));
		setError("");
	};

	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const nextValue = e.target.value;
		setAmountInput(nextValue);
		setAmount(nextValue === "" ? 0 : Number(nextValue));
		setError("");
	};

	const handleSubmit = async () => {
		setError("");

		if (!paymentMethod) {
			setError("Please select a payment method");
			return;
		}

		if (!amountInput || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
			setError("Please enter a valid amount");
			return;
		}

		if (paymentMethod === "qris" && parsedAmount < 1500) {
			setError("Minimum QRIS amount is IDR 1,500");
			return;
		}

		if (!effectiveReferenceId) {
			setError("Reference ID is missing");
			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/api/payments/midtrans/payments", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					amount: parsedAmount,
					transactionType,
					referenceId: effectiveReferenceId,
					paymentMethod,
					vaBank: paymentMethod === "va" ? vaBank : undefined,
					description: `${
						transactionType === "donation" ? "Donation via" : "Loan Repayment via"
					} ${paymentMethod === "qris" ? "QRIS" : "Virtual Account"}`,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to create payment");
			}

			const data = await response.json();

			const redirectUrl = new URLSearchParams({
				transactionId: data.transactionId,
				orderId: data.orderId,
				amount: String(parsedAmount),
				transactionType,
				paymentMethod,
				qrCodeUrl: data.qrCodeUrl || "",
				vaNumber: data.vaNumber || "",
				bankCode: data.bankCode || "",
				billerCode: data.billerCode || "",
				billKey: data.billKey || "",
				expiryTime: data.expiryTime || "",
			}).toString();

			router.push(`/payment/confirm?${redirectUrl}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen w-full flex-col bg-[#F3F5F7]">
			<ApplicantDashboard_ApplicantNavbar />

			<main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
				<div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
					<div className="text-center">
						<h1 className="text-2xl font-bold leading-tight text-[#111827] md:text-3xl">
							Make a <span className="text-[#07B0C8]">Repayment</span>
						</h1>
						<p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-[#6B7280] md:text-[13px]">
							Tanggung jawab Anda meringankan beban kami dalam membantu orang lain yang juga membutuhkan.
						</p>
					</div>

					<div className="mt-6 rounded-xl border border-gray-200 bg-[#F9FAFB] p-4 shadow-sm md:p-5">
						<div className="mb-6">
							<div className="relative grid grid-cols-4 gap-2">
								<div className="absolute left-[12.5%] right-[12.5%] top-3.5 h-px bg-[#DCE3EA]" />

								{REPAYMENT_STEPS.map((step) => {
									const isActive = step.id === activeStep;

									return (
										<div key={step.id} className="relative z-10 flex flex-col items-center gap-1.5">
											<div
												className={`flex h-7 w-7 items-center justify-center rounded-full text-[14px] font-semibold ${
													isActive
														? "bg-[#07B0C8] text-white shadow-md"
														: "border border-[#DCE3EA] bg-[#EEF3F7] text-[#9CA9BA]"
												}`}
											>
												{step.id}
											</div>
											<p
												className={`text-center text-[12px] ${
													isActive ? "font-semibold text-[#07B0C8]" : "font-normal text-[#8FA0B6]"
												}`}
											>
												{step.label}
											</p>
										</div>
									);
								})}
							</div>
						</div>

						{!loansLoading && !effectiveReferenceId && status !== "loading" && (
							<div className="mb-5 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
								<p className="text-[12px] leading-snug text-yellow-900">
									<span className="font-semibold">
										{transactionType === "repayment"
											? "Unable to determine the donor account."
											: "No reference ID found."}
									</span>
									{transactionType === "repayment"
										? " Please sign in again before continuing."
										: " This payment still needs a repayment reference ID."}
								</p>
							</div>
						)}

						<div className="space-y-4">
							{activeStep === 1 && (
								<div>
									<label className="mb-2 block text-[12px] font-semibold text-gray-700">Select Loan</label>
									{loansLoading && (
										<p className="text-[11px] text-gray-500">Getting loan data...</p>
									)}
									{!loansLoading && loansError && (
										<p className="text-[11px] text-red-600">{loansError}</p>
									)}
									{!loansLoading && !loansError && loans.length === 0 && (
										<p className="text-[11px] text-gray-500">No active loans available.</p>
									)}
									{loans.length > 0 && (
										<select
											value={selectedLoanId}
											onChange={(event) => setSelectedLoanId(event.target.value)}
											className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#07B0C8]/50"
										>
											{loans.map((loan, index) => {
												const amountValue = loan.loanDetails?.approvedAmount || loan.requestedAmount;
												const dueLabel = loan.dueDate ? new Date(loan.dueDate).toLocaleDateString("id-ID") : "";
												const loanLabel = loan.description?.trim() || `Loan ${index + 1}`;

												return (
													<option key={loan.id} value={loan.id}>
														{loanLabel}
														{amountValue ? ` - ${formatIdr(Number(amountValue))}` : ""}
													</option>
												);
											})}
										</select>
									)}
								</div>
							)}

							{activeStep === 1 && (
								<div className="flex items-center justify-end">
									<button
										type="button"
										onClick={() => setActiveStep(2)}
										disabled={!canProceed || loansLoading}
										className={`rounded-xl px-4 py-2 text-[12px] font-semibold text-white transition ${
											!canProceed || loansLoading
												? "bg-gray-300 cursor-not-allowed"
												: "bg-[#07B0C8] hover:bg-[#059BB0]"
										}`}
									>
										Next
									</button>
								</div>
							)}

							{activeStep === 2 && (
								<>
									<div className="flex items-center justify-between">
										<div className="text-[13px] font-semibold text-gray-700">Pilih jumlah yang diinginkan</div>
										<div className="text-[11px] font-bold tracking-wider text-gray-400">IDR</div>
									</div>

									<div className="grid grid-cols-2 gap-2">
										{QUICK_AMOUNTS.map((quickAmount) => {
											const isSelected = amount === quickAmount;

											return (
												<button
													key={quickAmount}
													type="button"
													onClick={() => {
														setAmount(quickAmount);
														setAmountInput(String(quickAmount));
													}}
													disabled={!canProceed}
													className={`rounded-lg border py-2 text-[12px] font-medium transition ${
														isSelected
															? "border-[#07B0C8] bg-[#07B0C8]/10 text-[#06A3B9]"
															: "border-gray-200 text-gray-600 hover:border-[#07B0C8]/45 hover:bg-[#F0FBFD]"
													}`}
												>
													{formatIdr(quickAmount)}
												</button>
											);
										})}
									</div>

									<div className="mb-4">
										<label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Custom Amount</label>
										<div className="relative">
											<input
												type="number"
												value={amountInput}
												onChange={handleAmountChange}
												placeholder="0"
												min={paymentMethod === "qris" ? "1500" : "1000"}
												step="1000"
												className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[14px] transition-all focus:outline-none focus:ring-2 focus:ring-[#07B0C8]/50"
												disabled={!canProceed}
											/>
										</div>
										<p className="mt-1 text-[10px] text-gray-400 italic">
											Min: {paymentMethod === "qris" ? "IDR 1,500" : "IDR 1,000"}
										</p>
									</div>
								</>
							)}
						</div>

						{error && (
							<div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-2.5">
								<p className="text-[11px] font-medium text-red-600">{error}</p>
							</div>
						)}

						{activeStep === 2 && (
							<div className="mb-5">
								<label className="mb-2 block text-[12px] font-semibold text-gray-700">Payment Method</label>

								<div
									onClick={() => handlePaymentMethodSelect("qris")}
									className={`mb-2 cursor-pointer rounded-xl border p-3 transition-all ${
										paymentMethod === "qris"
											? "border-[#07B0C8] bg-[#07B0C8]/5 shadow-sm"
											: "border-gray-100 bg-white hover:border-gray-200"
									}`}
								>
									<div className="flex items-center">
										<div
											className={`mr-3 flex h-4 w-4 items-center justify-center rounded-full border ${
												paymentMethod === "qris" ? "border-[#07B0C8] bg-[#07B0C8]" : "border-gray-300"
											}`}
										>
											{paymentMethod === "qris" && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
										</div>
										<div>
											<p className="text-[13px] font-semibold text-gray-900">QRIS (Any E-Wallet)</p>
											<p className="text-[10px] text-gray-500">GoPay, OVO, Dana, LinkAja</p>
										</div>
									</div>
								</div>

								<div
									onClick={() => handlePaymentMethodSelect("va")}
									className={`cursor-pointer rounded-xl border p-3 transition-all ${
										paymentMethod === "va"
											? "border-[#07B0C8] bg-[#07B0C8]/5 shadow-sm"
											: "border-gray-100 bg-white hover:border-gray-200"
									}`}
								>
									<div className="flex items-center">
										<div
											className={`mr-3 flex h-4 w-4 items-center justify-center rounded-full border ${
												paymentMethod === "va" ? "border-[#07B0C8] bg-[#07B0C8]" : "border-gray-300"
											}`}
										>
											{paymentMethod === "va" && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
										</div>
										<div>
											<p className="text-[13px] font-semibold text-gray-900">Virtual Account (VA)</p>
											<p className="text-[10px] text-gray-500">Transfer bank via Midtrans</p>
										</div>
									</div>
								</div>
							</div>
						)}
						{activeStep === 2 && paymentMethod === "va" && (
							<div className="mb-5">
								<label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Select Bank</label>
								<select
									value={vaBank}
									onChange={(e) => setVaBank(e.target.value as VABank)}
									className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#07B0C8]/50"
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

						{activeStep === 2 && (
							<div className="flex items-center justify-between">
								<button
									type="button"
									onClick={() => setActiveStep(1)}
									className="rounded-xl border border-gray-200 px-4 py-2 text-[12px] font-semibold text-gray-600 hover:bg-gray-50"
								>
									Back
								</button>
								<button
									onClick={handleSubmit}
									disabled={loading || !paymentMethod || !amountInput || !effectiveReferenceId}
									className={`rounded-xl px-5 py-2 text-[12px] font-semibold text-white transition ${
										loading || !paymentMethod || !amountInput || !effectiveReferenceId
											? "bg-gray-300 cursor-not-allowed"
											: "bg-[#07B0C8] hover:bg-[#059BB0]"
									}`}
								>
									{loading ? "Processing..." : "Continue to Payment"}
								</button>
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
