'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

import { useDonationStore } from '@/hooks/donationStore';
import { PaymentMethod, VABank, TransactionType } from '@/types/donation';
import DonorDashboard_DonorNavbar from '@/components/ui/donor-dashboard/donor_navbar';
import { ShieldAlert } from 'lucide-react';

const DONATION_STEPS = [
  { id: 1, label: 'Select Amount' },
  { id: 2, label: 'Payment' },
  { id: 3, label: 'Confirmation' },
] as const;

const QUICK_AMOUNTS = [50000, 100000, 250000, 500000];

const formatIdr = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace('Rp', 'Rp ');

export default function DonateFormPage({
  searchParams
}: {
  searchParams: Promise<{ type?: 'donation' | 'repayment'; referenceId?: string }>;
}) {
  
  const router = useRouter();
  const { data: session, status } = useSession();
  const params = use(searchParams);
  const paymentMethod = useDonationStore((state) => (state.donation?.payment_method))
  const vaBank = useDonationStore((state) => (state.donation?.va_bank))
  const amount = useDonationStore((state) => (state.donation?.amount))
  const setAmount = useDonationStore((state) => (state.setAmount))
  const setPaymentMethod = useDonationStore((state) => (state.setPaymentMethod))
  const setVaBank = useDonationStore((state) => (state.setVABank))
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);
  const [donorRole, setDonorRole] = useState<{
    verificationStatus: string;
    verificationMessage?: string | null;
    missingDocumentLabels?: string[];
  } | null>(null);

  const transactionType: TransactionType = (params.type as TransactionType) || 'donation';
  const referenceId =
    params.referenceId || (transactionType === 'donation' ? session?.user?.id || '' : '');

  useEffect(() => {
    let isMounted = true;

    const fetchAccountStatus = async () => {
      try {
        const response = await fetch('/api/user/me', { cache: 'no-store' });
        if (!response.ok) throw new Error('ACCOUNT_STATUS_FETCH_FAILED');

        const payload = await response.json();
        const role = (payload.data?.roles || []).find((item: { role: string }) => item.role === 'DONOR') || null;
        if (isMounted) setDonorRole(role);
      } catch {
        if (isMounted) setDonorRole(null);
      } finally {
        if (isMounted) setIsCheckingVerification(false);
      }
    };

    void fetchAccountStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const isDonorVerified = donorRole?.verificationStatus === 'VERIFIED';
  const donorBlockedMessage = !donorRole
    ? 'Akun belum terdaftar sebagai Donatur. Daftar sebagai Donatur terlebih dahulu untuk melakukan donasi.'
    : donorRole.verificationStatus === 'REVISION_REQUESTED'
      ? donorRole.verificationMessage || 'Admin meminta perbaikan dokumen. Perbarui dokumen yang diminta agar akun dapat ditinjau ulang.'
      : donorRole.verificationStatus === 'REJECTED'
        ? donorRole.verificationMessage || 'Verifikasi akun Donatur ditolak. Perbarui data atau hubungi admin untuk bantuan.'
        : (donorRole.missingDocumentLabels || []).length > 0
          ? `Dokumen Donatur belum lengkap: ${(donorRole.missingDocumentLabels || []).join(', ')}.`
          : 'Akun Belum Terverifikasi, Tunggu Hingga Admin Melakukan Verifikasi.';

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
      setError('Pilih metode pembayaran.');
      return;
    }

    if (transactionType === 'donation' && !isDonorVerified) {
      setError(donorBlockedMessage);
      return;
    }

    if (!amount || parseFloat(String(amount)) <= 0) {
      setError('Masukkan jumlah yang valid.');
      return;
    }

    if (paymentMethod === 'qris' && parseFloat(String(amount)) < 1500) {
      setError('Minimum nilai transaksi QRIS adalah IDR 1,500');
      return;
    }

    if (!referenceId) {
      setError('Reference ID tidak ditemukan');
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
    <div className="min-h-screen bg-[#F3F5F7]">
      <DonorDashboard_DonorNavbar />

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="text-center">
          <h1 className="text-[2.1rem] font-semibold leading-none tracking-tight text-[#111827] md:text-[2.5rem]">
            Buat <span className="text-[#07B0C8]">Donasi</span>
          </h1>
          <p className="mt-2 text-[13.5px] text-[#6B7280] md:text-[15px]">
            Kedermawanan Anda mendukung siswa dengan pinjaman bebas bunga dan beasiswa.
          </p>
        </div>

        {/* main content container */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-[0_3px_10px_-8px_rgba(17,24,39,0.18)] md:p-6">

          {/* donation progress */}
          <div className="mb-7">
            <div className="relative grid grid-cols-3">
              <div className="absolute left-[16.67%] right-[16.67%] top-4 h-px bg-[#DCE3EA]" />

              {DONATION_STEPS.map((step) => {
                const isActive = step.id === activeStep;

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-[18px] font-medium ${isActive ? 'bg-[#07B0C8] text-white shadow-[0_6px_14px_-10px_rgba(7,176,200,0.9)]' : 'border border-[#DCE3EA] bg-[#EEF3F7] text-[#9CA9BA]'}`}
                    >
                      {step.id}
                    </div>
                    <p
                      className={`text-center text-[15px] ${isActive ? 'font-medium text-[#07B0C8]' : 'font-normal text-[#8FA0B6]'}`}
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
            <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm text-yellow-900">
                <span className="font-medium">
                  {transactionType === 'donation'
                    ? 'Tidak dapat menentukan akun donatur.'
                    : 'Reference ID tidak ditemukan.'}
                </span>
                {transactionType === 'donation'
                  ? ' Harap sign in kembali sebelum melanjutkan.'
                  : ' Pembayaran ini masih membutuhkan reference ID ke suatu pembayaran kembali.'}
              </p>
            </div>
          )}

          {isCheckingVerification && transactionType === 'donation' && (
            <div className="mb-6 rounded-lg border border-[#E2E8F0] bg-white p-8 text-sm font-semibold text-[#667085] shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
              Memeriksa status verifikasi akun...
            </div>
          )}

          {!isCheckingVerification && transactionType === 'donation' && !isDonorVerified && (
            <div className="rounded-lg border border-amber-200 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <ShieldAlert size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-extrabold text-slate-900">Akun Donatur Belum Terverifikasi</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{donorBlockedMessage}</p>
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={donorRole ? "/profile?from=DONOR" : "/account/roles?role=DONOR&from=DONOR"}
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-[#07B0C8] px-4 text-sm font-bold text-white transition hover:bg-[#069CB1]"
                    >
                      {donorRole ? "Perbarui Dokumen" : "Daftar sebagai Donatur"}
                    </Link>
                    <Link
                      href="/donor/dashboard"
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-gray-50"
                    >
                      Kembali ke Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

        {!isCheckingVerification && (transactionType !== 'donation' || isDonorVerified) && (
        <div className="space-y-4">

          {/* title + idr */}
          <div className='flex items-center justify-between'>

            {/* title */}
            <div className='text-sm font-medium text-gray-700'>
              Pilih jumlah yang diiginkan
            </div>

            {/* idr */}
            <div className='text-sm font-medium text-gray-700'>
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
                  className={`rounded-xl border p-2.5 text-[13px] font-medium transition ${isSelected ? 'border-[#07B0C8] bg-[#07B0C8]/10 text-[#06A3B9]' : 'border-gray-300/80 text-gray-700 hover:border-[#07B0C8]/45 hover:bg-[#F0FBFD]'}`}
                >
                  {formatIdr(quickAmount)}
                </button>
              );
            })}
          </div>

          {/* manual input section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah (IDR)
            </label>
            <input
              type="number"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Enter amount"
              min={paymentMethod === 'qris' ? '1500' : '1000'}
              step="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#07B0C8]"
              disabled={!paymentMethod}
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum: {paymentMethod === 'qris' ? 'IDR 1,500 (QRIS)' : 'IDR 1,000'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Pilih Metode Pembayaran
            </label>

            {/* QRIS Option */}
            <div
              onClick={() => handlePaymentMethodSelect('qris')}
              className={`mb-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                paymentMethod === 'qris'
                  ? 'border-[#07B0C8] bg-[#07B0C8]/10'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
            <div className="flex items-center">
              <div
                className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                  paymentMethod === 'qris' ? 'border-[#07B0C8] bg-[#07B0C8]' : 'border-gray-300'
                }`}
              >
                {paymentMethod === 'qris' && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <div>
                <p className="font-medium text-gray-900">QRIS (E-Wallet apapun)</p>
                <p className="text-xs text-gray-500">GoPay, OVO, Dana, LinkAja, etc.</p>
              </div>
            </div>
          </div>

          {/* Bank Transfer Option */}
          <div
            onClick={() => handlePaymentMethodSelect('va')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
              paymentMethod === 'va'
                ? 'border-[#07B0C8] bg-[#07B0C8]/10'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                  paymentMethod === 'va'
                    ? 'border-[#07B0C8] bg-[#07B0C8]'
                    : 'border-gray-300'
                }`}
              >
                {paymentMethod === 'va' && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Virtual Account (VA)</p>
                <p className="text-xs text-gray-500">Transfer bank via Midtrans</p>
              </div>
            </div>
          </div>
        </div>

          {paymentMethod === 'va' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">VA Bank</label>
              <select
                value={vaBank}
                onChange={(e) => setVaBank(e.target.value as VABank)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#07B0C8]"
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
            disabled={loading || !paymentMethod || !amount || !referenceId || isCheckingVerification}
            className={`w-full py-2 px-4 rounded-md font-medium text-white transition ${
              loading || !paymentMethod || !amount || !referenceId || isCheckingVerification
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#07B0C8] hover:bg-[#059BB0]'
            }`}
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
          </button>

          {/* Back Link */}
          <div className="mt-4 text-center">
            <Link href="/donor/dashboard" className="text-sm text-[#07B0C8] hover:underline">
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
        )}
      </div>
      </main>
    </div>
  );
}
