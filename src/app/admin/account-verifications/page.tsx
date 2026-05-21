"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, FileText, RefreshCw, ShieldCheck, XCircle } from "lucide-react";

import AdminDashboard_AdminNavbar from "@/components/ui/admin-dashboard/admin_navbar";

type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "REVISION_REQUESTED";

type VerificationDocument = {
  type: string;
  label: string;
  uploadedAt: string | null;
  signedUrl: string | null;
  isUploaded: boolean;
};

type VerificationRequest = {
  userId: string;
  role: "DONOR" | "BORROWER";
  roleLabel: string;
  verificationStatus: VerificationStatus;
  verificationMessage?: string | null;
  verificationRequestedAt: string;
  documentsUpdatedAt?: string | null;
  reviewedAt?: string | null;
  hasDocumentUpdate: boolean;
  missingDocumentLabels: string[];
  user: {
    name: string;
    email: string;
    phone_number?: string | null;
    address?: string | null;
  };
  documents: VerificationDocument[];
};

const STATUS_FILTERS: { label: string; value?: VerificationStatus }[] = [
  { label: "Semua" },
  { label: "Menunggu", value: "PENDING" },
  { label: "Perbaikan", value: "REVISION_REQUESTED" },
  { label: "Terverifikasi", value: "VERIFIED" },
  { label: "Ditolak", value: "REJECTED" },
];

const statusClassName: Record<VerificationStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  REVISION_REQUESTED: "border-orange-200 bg-orange-50 text-orange-700",
  VERIFIED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function DocumentTile({ document }: { document: VerificationDocument }) {
  const isPdf = document.signedUrl?.toLowerCase().includes(".pdf");

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="flex h-36 items-center justify-center bg-gray-50">
        {!document.signedUrl ? (
          <FileText className="h-9 w-9 text-gray-300" />
        ) : isPdf ? (
          <FileText className="h-10 w-10 text-red-500" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={document.signedUrl} alt={document.label} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="p-3">
        <div className="truncate text-sm font-bold text-slate-800">{document.label}</div>
        <div className={`mt-1 text-xs font-semibold ${document.isUploaded ? "text-emerald-700" : "text-red-600"}`}>
          {document.isUploaded ? `Upload ${formatDate(document.uploadedAt)}` : "Belum ada"}
        </div>
        {document.signedUrl && (
          <a
            href={document.signedUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex text-xs font-bold text-[#07B0C8] hover:underline"
          >
            Buka dokumen
          </a>
        )}
      </div>
    </div>
  );
}

export default function AdminAccountVerificationsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [submittingKey, setSubmittingKey] = useState("");

  const fetchRequests = async (status?: VerificationStatus) => {
    setIsLoading(true);
    setError("");

    try {
      const params = status ? `?status=${status}` : "";
      const response = await fetch(`/api/admin/account-verifications${params}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Gagal memuat data verifikasi");

      setRequests(payload.data || []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Gagal memuat data verifikasi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchRequests(statusFilter);
  }, [statusFilter]);

  const requestKey = (request: VerificationRequest) => `${request.userId}:${request.role}`;

  const handleDecision = async (request: VerificationRequest, status: VerificationStatus) => {
    const key = requestKey(request);
    const message = messages[key] || "";

    if ((status === "REJECTED" || status === "REVISION_REQUESTED") && !message.trim()) {
      setError("Pesan wajib diisi untuk menolak atau meminta perbaikan dokumen.");
      return;
    }

    setSubmittingKey(`${key}:${status}`);
    setError("");

    try {
      const response = await fetch("/api/admin/account-verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: request.userId,
          role: request.role,
          status,
          message: message || null,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Gagal memperbarui status verifikasi");

      await fetchRequests(statusFilter);
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Gagal memperbarui status verifikasi");
    } finally {
      setSubmittingKey("");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <AdminDashboard_AdminNavbar />

      <main className="mx-auto w-full max-w-350 px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1E293B] sm:text-4xl">Verifikasi Akun</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
              Tinjau dokumen identitas untuk role Donatur dan Peminjam sebelum mereka bisa berdonasi atau mengajukan pinjaman.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchRequests(statusFilter)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        <div className="mt-6 overflow-x-auto border-b border-gray-200">
          <div className="flex min-w-max gap-2">
            {STATUS_FILTERS.map((filter) => {
              const isActive = statusFilter === filter.value;
              return (
                <button
                  key={filter.label}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={`border-b-2 px-4 pb-3 text-sm font-bold transition ${isActive ? "border-[#07B0C8] text-[#07B0C8]" : "border-transparent text-gray-500 hover:text-slate-800"}`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-8 text-sm font-semibold text-gray-500">
            Memuat permintaan verifikasi...
          </div>
        )}

        {!isLoading && requests.length === 0 && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-10 text-center text-sm font-semibold text-gray-500">
            Tidak ada akun pada filter ini.
          </div>
        )}

        <div className="mt-6 grid gap-5">
          {requests.map((request) => {
            const key = requestKey(request);
            return (
              <article key={key} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-extrabold text-slate-900">{request.user.name}</h2>
                      <span className="rounded-full bg-[#F0FBFD] px-2.5 py-1 text-xs font-bold text-[#07B0C8]">{request.roleLabel}</span>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClassName[request.verificationStatus]}`}>
                        {request.verificationStatus}
                      </span>
                      {request.hasDocumentUpdate && (
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                          Dokumen diperbarui
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{request.user.email}</p>
                    <div className="mt-3 grid gap-2 text-xs font-medium text-gray-500 sm:grid-cols-3">
                      <span>Diajukan: {formatDate(request.verificationRequestedAt)}</span>
                      <span>Update dokumen: {formatDate(request.documentsUpdatedAt)}</span>
                      <span>Review terakhir: {formatDate(request.reviewedAt)}</span>
                    </div>
                    {request.verificationMessage && (
                      <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
                        {request.verificationMessage}
                      </p>
                    )}
                    {request.missingDocumentLabels.length > 0 && (
                      <p className="mt-3 text-sm font-bold text-red-600">
                        Dokumen kurang: {request.missingDocumentLabels.join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {request.documents.map((document) => (
                    <DocumentTile key={`${key}:${document.type}`} document={document} />
                  ))}
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <label className="flex flex-col gap-2 text-sm font-bold text-slate-700">
                    Pesan untuk user
                    <textarea
                      value={messages[key] || ""}
                      onChange={(event) => setMessages((current) => ({ ...current, [key]: event.target.value }))}
                      className="min-h-22 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium outline-none transition focus:border-[#07B0C8] focus:ring-3 focus:ring-cyan-100"
                      placeholder="Contoh: Foto KTP buram, mohon upload ulang bagian depan KTP."
                    />
                  </label>

                  <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                    <button
                      type="button"
                      onClick={() => handleDecision(request, "VERIFIED")}
                      disabled={Boolean(submittingKey) || request.missingDocumentLabels.length > 0}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      <ShieldCheck size={16} />
                      Verifikasi
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(request, "REVISION_REQUESTED")}
                      disabled={Boolean(submittingKey)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Clock size={16} />
                      Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(request, "REJECTED")}
                      disabled={Boolean(submittingKey)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <XCircle size={16} />
                      Tolak
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
