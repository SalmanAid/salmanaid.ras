'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

type PaymentStatus = 'PENDING' | 'SETTLEMENT' | 'EXPIRE' | 'FAILURE' | null;
type PaymentMethod = 'qris' | 'va';

export default function PaymentConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{
    transactionId?: string;
    orderId?: string;
    amount?: string;
    transactionType?: string;
    paymentMethod?: string;
    qrCodeUrl?: string;
    vaNumber?: string;
    bankCode?: string;
    billerCode?: string;
    billKey?: string;
    expiryTime?: string;
  }>;
}) {
  const params = use(searchParams);

  const [status, setStatus] = useState<PaymentStatus>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [simulateMessage, setSimulateMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [connectionMessage, setConnectionMessage] = useState('Menyambungkan ke pembaruan pembayaran secara live...');

  const [qrCodeUrl, setQrCodeUrl] = useState(params.qrCodeUrl || '');
  const [vaNumber, setVaNumber] = useState(params.vaNumber || '');
  const [bankCode, setBankCode] = useState(params.bankCode || '');
  const [billerCode, setBillerCode] = useState(params.billerCode || '');
  const [billKey, setBillKey] = useState(params.billKey || '');
  const [expiryTime, setExpiryTime] = useState(params.expiryTime || '');

  const transactionId = params.transactionId || '';
  const orderId = params.orderId || '';
  const amount = params.amount || '0';
  const transactionType = params.transactionType || 'donation';
  const paymentMethod: PaymentMethod = params.paymentMethod === 'va' ? 'va' : 'qris';
  const simulateLoading = false;

  const sandboxMode = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_APP_ENV !== 'production';

  const applyPaymentDetail = (data: {
    status?: PaymentStatus;
    qris?: { qrCodeImageUrl?: string | null };
    va?: {
      vaNumber?: string | null;
      bankCode?: string | null;
      billerCode?: string | null;
      billKey?: string | null;
    };
    expiryTime?: string | null;
  }) => {
    if (data.status) setStatus(data.status);
    if (data.qris?.qrCodeImageUrl) setQrCodeUrl(data.qris.qrCodeImageUrl);
    if (data.va?.vaNumber) setVaNumber(data.va.vaNumber);
    if (data.va?.bankCode) setBankCode(data.va.bankCode);
    if (data.va?.billerCode) setBillerCode(data.va.billerCode);
    if (data.va?.billKey) setBillKey(data.va.billKey);
    if (data.expiryTime) setExpiryTime(data.expiryTime);
  };

  useEffect(() => {
    const loadPaymentDetail = async () => {
      if (!orderId) {
        setError('Order ID is missing');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/payments/midtrans/payments/${orderId}`, {
          method: 'GET',
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Gagal mengecek status pembayaran');
        }

        applyPaymentDetail(data.data || {});
        setConnectionMessage('Pembaruan Pembayaran Live terhubung.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check payment status');
      } finally {
        setLoading(false);
      }
    };

    void loadPaymentDetail();
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;

    const eventSource = new EventSource(`/api/payments/midtrans/payments/${orderId}/events`);

    eventSource.addEventListener('connected', () => {
      setConnectionMessage('Pembaruan Pembayaran Live terhubung.');
      setError('');
    });

    eventSource.addEventListener('payment', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as {
        success: boolean;
        data?: {
          status?: PaymentStatus;
          qris?: { qrCodeImageUrl?: string | null };
          va?: {
            vaNumber?: string | null;
            bankCode?: string | null;
            billerCode?: string | null;
            billKey?: string | null;
          };
          expiryTime?: string | null;
        };
      };

      if (payload.data) {
        applyPaymentDetail(payload.data);
        setError('');

        if (['SETTLEMENT', 'EXPIRE', 'FAILURE'].includes(payload.data.status || '')) {
          setConnectionMessage('Pembaruan Pembayaran Live selesai.');
          eventSource.close();
        }
      }
    });

    eventSource.addEventListener('payment-error', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { error?: string };
      if (payload.error) setError(payload.error);
      setConnectionMessage('Pembaruan Pembayaran Live terputus.');
      eventSource.close();
    });

    eventSource.onerror = () => {
      setConnectionMessage('Pembaruan Pembayaran Live terputus.');
      eventSource.close();
    };

    return () => eventSource.close();
  }, [orderId]);

  const formatExpiry = (value: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('id-ID');
  };

  const getStatusColor = (currentStatus: PaymentStatus) => {
    switch (currentStatus) {
      case 'SETTLEMENT':
        return 'text-green-600 bg-green-50';
      case 'PENDING':
        return 'text-blue-600 bg-blue-50';
      case 'EXPIRE':
      case 'FAILURE':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (currentStatus: PaymentStatus) => {
    switch (currentStatus) {
      case 'SETTLEMENT':
        return 'PAID SUCCESSFULLY';
      case 'PENDING':
        return 'WAITING FOR PAYMENT';
      case 'EXPIRE':
        return 'PAYMENT EXPIRED';
      case 'FAILURE':
        return 'PAYMENT FAILED';
      default:
        return 'CHECKING STATUS';
    }
  };

  const copyToClipboard = async (text: string) => {
    if (!text) {
      setCopyMessage('Nothing to copy');
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (!copied) {
          throw new Error('Copy command failed');
        }
      }

      setCopyMessage('Copied successfully');
    } catch {
      setCopyMessage('Failed to copy');
    }
  };

  const getVaSimulatorUrl = (currentBankCode: string) => {
    const normalized = (currentBankCode || '').toLowerCase();

    if (normalized === 'bca') {
      return 'https://simulator.sandbox.midtrans.com/bca/va/index';
    }

    if (normalized === 'bni') {
      return 'https://simulator.sandbox.midtrans.com/bni/va/index';
    }

    if (normalized === 'bri') {
      return 'https://simulator.sandbox.midtrans.com/openapi/va/index?bank=bri';
    }

    if (normalized === 'permata') {
      return 'https://simulator.sandbox.midtrans.com/openapi/va/index?bank=permata';
    }

    if (normalized === 'cimb') {
      return 'https://simulator.sandbox.midtrans.com/openapi/va/index?bank=cimb';
    }

    if (normalized === 'mandiri_bill' || normalized === 'mandiri' || normalized === 'echannel') {
      return 'https://simulator.sandbox.midtrans.com/openapi/va/index?bank=mandiri';
    }

    return 'https://simulator.sandbox.midtrans.com/';
  };

  const handleSimulatePayment = async () => {
    setSimulateMessage('');
    setError('');

    if (paymentMethod === 'qris') {
      try {
        window.open(
          'https://simulator.sandbox.midtrans.com/v2/qris/index',
          '_blank',
          'noopener,noreferrer'
        );
        setSimulateMessage('Midtrans QRIS simulator terbuka.');
      } catch {
        setError('Gagal membuka Midtrans QRIS simulator');
      }
      return;
    }

    try {
      const simulatorUrl = getVaSimulatorUrl(bankCode);
      window.open(simulatorUrl, '_blank', 'noopener,noreferrer');
      setSimulateMessage('Midtrans VA simulator terbuka.');
    } catch {
      setError('Gagal membuka Midtrans VA simulator');
    }
  };


  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-4 ${getStatusColor(status)}`}>
            {getStatusLabel(status)}
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#07B0C8] mb-2">Konfirmasi Pembayaran</h1>
            <p className="text-gray-600">
              {transactionType === 'donation' ? 'Donation' : 'Loan Repayment'} - {paymentMethod === 'qris' ? 'QRIS' : 'Virtual Account'}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">ID Pemesanan</p>
              <p className="text-sm font-medium text-gray-900 break-all">{orderId}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">ID Transaksi</p>
              <p className="text-sm font-medium text-gray-900 break-all">{transactionId || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Jumlah</p>
              <p className="text-lg font-bold text-[#07B0C8]">{formatCurrency(amount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Kadaluwarsa pada</p>
              <p className="text-sm font-medium text-gray-900">{formatExpiry(expiryTime)}</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {paymentMethod === 'qris' && (
            <div className="mb-6 p-4 bg-[#07B0C8]/10 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Pembayaran QRIS</h3>
              <ol className="space-y-2 text-sm text-gray-700 mb-4">
                <li><span className="font-medium">1. Pindai gambar QRIS </span> dengan aplikasi banking/e-wallet Anda</li>
                <li><span className="font-medium">2. Konfirmasi jumlah pasti </span> sebelum melakukan pembayaran</li>
                <li><span className="font-medium">3. Harap tunggu untuk pembaruan status </span> pada halaman ini</li>
              </ol>

              {qrCodeUrl ? (
                <div className="rounded-md bg-white p-4 flex justify-center">
                  <img src={qrCodeUrl} alt="Midtrans QRIS" className="w-60 h-60 object-contain" />
                </div>
              ) : (
                <div className="px-4 py-3 bg-gray-200 text-gray-600 text-center rounded-md">Gambar QR belum tersedia. Mohon tunggu...</div>
              )}
            </div>
          )}

          {paymentMethod === 'va' && (
            <div className="mb-6 p-4 bg-[#07B0C8]/10 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Pembayaran Virtual Account</h3>
              <ol className="space-y-2 text-sm text-gray-700 mb-4">
                <li><span className="font-medium">1. Gunakan bank</span> {bankCode ? bankCode.toUpperCase() : '-'}</li>
                <li>
                  <span className="font-medium">2. Gunakan detail pembayaran</span>{' '}
                  {bankCode?.toLowerCase() === 'mandiri_bill' || bankCode?.toLowerCase() === 'mandiri' || bankCode?.toLowerCase() === 'echannel'
                    ? 'below (Biller Code + Bill Key)'
                    : 'below (VA Number)'}
                </li>
                <li><span className="font-medium">3. Harap tunggu untuk pembaruan status</span> di halaman ini</li>
              </ol>

              <div className="bg-white rounded-md p-4 border border-[#07B0C8]/20">
                {(bankCode?.toLowerCase() === 'mandiri_bill' ||
                  bankCode?.toLowerCase() === 'mandiri' ||
                  bankCode?.toLowerCase() === 'echannel') ? (
                  <>
                    <p className="text-xs text-gray-500 uppercase mb-1">Kode Penagih</p>
                    <p className="text-xl font-bold tracking-wider text-gray-900 break-all">{billerCode || '-'}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCopyMessage('');
                        void copyToClipboard(billerCode);
                      }}
                      disabled={!billerCode}
                      className={`mt-3 px-4 py-2 rounded-md text-sm font-medium ${
                        billerCode ? 'bg-[#07B0C8] text-white hover:bg-[#059BB0]' : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      Salin Kode Penagihan
                    </button>

                    <p className="text-xs text-gray-500 uppercase mt-4 mb-1">Kunci Tagihan</p>
                    <p className="text-xl font-bold tracking-wider text-gray-900 break-all">{billKey || '-'}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCopyMessage('');
                        void copyToClipboard(billKey);
                      }}
                      disabled={!billKey}
                      className={`mt-3 px-4 py-2 rounded-md text-sm font-medium ${
                        billKey ? 'bg-[#07B0C8] text-white hover:bg-[#059BB0]' : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      Salin Kunci Tagihan
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 uppercase mb-1">Nomor VA</p>
                    <p className="text-xl font-bold tracking-wider text-gray-900 break-all">{vaNumber || '-'}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCopyMessage('');
                        void copyToClipboard(vaNumber);
                      }}
                      disabled={!vaNumber}
                      className={`mt-3 px-4 py-2 rounded-md text-sm font-medium ${
                        vaNumber ? 'bg-[#07B0C8] text-white hover:bg-[#059BB0]' : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      Salin Nomor VA
                    </button>
                  </>
                )}
                {copyMessage && <p className="mt-2 text-sm text-gray-700">{copyMessage}</p>}
              </div>
            </div>
          )}

          {sandboxMode && status !== 'SETTLEMENT' && (
            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={simulateLoading || !orderId}
              className={`mb-4 w-full px-4 py-3 text-center rounded-md font-medium transition ${
                simulateLoading || !orderId
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {simulateLoading
                ? 'Mensimulasikan Payment...'
                : paymentMethod === 'qris'
                  ? 'Buka Midtrans QRIS Simulator'
                  : 'Buka Midtrans VA Simulator'}
            </button>
          )}

          {simulateMessage && <p className="mb-4 text-sm text-green-700">{simulateMessage}</p>}

          {status === 'SETTLEMENT' && (
            <div className="mb-6 p-4 bg-[#07B0C8]/10 border border-[#07B0C8] rounded-lg">
              <p className="text-[#07B0C8] font-medium">Transaksi berhasil!</p>
            </div>
          )}

          {status === 'EXPIRE' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">Pembayaran Kadaluwarsa</p>
              <Link href="/payment" className="inline-block mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium">
                Buat Transaksi Baru
              </Link>
            </div>
          )}

          {status === 'FAILURE' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">Pembayaran Gagal</p>
              <Link href="/payment" className="inline-block mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium">
                Coba Ulang Pembayaran 
              </Link>
            </div>
          )}

          {!loading && (
            <div className="text-center text-sm text-gray-500">{connectionMessage}</div>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <Link href="/" className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 font-medium">
            Kembali ke Halaman Landing
          </Link>
        </div>
      </div>
    </div>
  );
}
