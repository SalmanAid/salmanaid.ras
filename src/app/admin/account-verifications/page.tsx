"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Clock, FileText, IdCard, MapPin, Phone, RefreshCw, ShieldCheck, XCircle } from "lucide-react";

import AdminDashboard_AdminNavbar from "@/components/ui/admin-dashboard/admin_navbar";
import { AdminSearch } from "@/components/ui/admin-search";
import { useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

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
  missingIdentityLabels: string[];
  user: {
    name: string;
    email: string;
    nik?: string | null;
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

const roleBadgeClassName: Record<VerificationRequest["role"], string> = {
  DONOR: "bg-[#F0FBFD] text-[#07B0C8]",
  BORROWER: "bg-[#FFF8E8] text-[#FCB82E]",
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

function IdentityItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: string | null;
}) {
  const hasValue = Boolean(value?.trim());

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${hasValue ? "bg-[#F0FBFD] text-[#07B0C8]" : "bg-red-50 text-red-500"}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-gray-500">{label}</div>
          <div className={`mt-1 wrap-break-word text-sm font-bold ${hasValue ? "text-slate-800" : "text-red-600"}`}>
            {hasValue ? value : "Belum diisi"}
          </div>
        </div>
      </div>
    </div>
  );
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
  const toast = useToast();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [messageErrors, setMessageErrors] = useState<Record<string, string>>({});
  const [submittingKey, setSubmittingKey] = useState("");
  const [sortBy, setSortBy] = useState<"submissionTime" | "updateTime" | "type" | undefined>();
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const fetchRequests = useCallback(async (
    status?: VerificationStatus,
    searchQuery = "",
    signal?: AbortSignal
  ) => {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/admin/account-verifications?${params}`, {
        cache: "no-store",
        signal,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Gagal memuat data verifikasi");

      setRequests(payload.data || []);
    } catch (fetchError) {
      if (!(fetchError instanceof DOMException && fetchError.name === "AbortError")) {
        setError(fetchError instanceof Error ? fetchError.message : "Gagal memuat data verifikasi");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchRequests(statusFilter, debouncedSearch, controller.signal);
    return () => controller.abort();
  }, [debouncedSearch, fetchRequests, statusFilter]);

  const requestKey = (request: VerificationRequest) => `${request.userId}:${request.role}`;

  const getSortedRequests = (): VerificationRequest[] => {
    const sorted = [...requests];
    
    if (!sortBy) return sorted;

    sorted.sort((a, b) => {
      let compareResult = 0;

      if (sortBy === "submissionTime") {
        const dateA = new Date(a.verificationRequestedAt).getTime();
        const dateB = new Date(b.verificationRequestedAt).getTime();
        compareResult = dateA - dateB;
      } else if (sortBy === "updateTime") {
        const dateA = new Date(a.documentsUpdatedAt || 0).getTime();
        const dateB = new Date(b.documentsUpdatedAt || 0).getTime();
        compareResult = dateA - dateB;
      } else if (sortBy === "type") {
        compareResult = a.role.localeCompare(b.role);
      }

      return sortDirection === "asc" ? compareResult : -compareResult;
    });

    return sorted;
  };

  const handleDecision = async (request: VerificationRequest, status: VerificationStatus) => {
    if (request.verificationStatus === "VERIFIED") return;

    const key = requestKey(request);
    const message = messages[key] || "";

    if ((status === "REJECTED" || status === "REVISION_REQUESTED") && !message.trim()) {
      setMessageErrors((current) => ({
        ...current,
        [key]: "Alasan wajib diisi untuk Pending atau Tolak.",
      }));
      setError("");
      return;
    }

    setSubmittingKey(`${key}:${status}`);
    setMessageErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
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

      await fetchRequests(statusFilter, debouncedSearch);
      const toastCopy: Record<VerificationStatus, { title: string; description: string }> = {
        VERIFIED: {
          title: "Akun berhasil diverifikasi",
          description: `${request.user.name} sudah dapat menggunakan role ${request.roleLabel}.`,
        },
        REVISION_REQUESTED: {
          title: "Permintaan perbaikan terkirim",
          description: `Status ${request.roleLabel} untuk ${request.user.name} dikembalikan ke pending.`,
        },
        REJECTED: {
          title: "Verifikasi ditolak",
          description: `Penolakan akun ${request.user.name} berhasil disimpan.`,
        },
        PENDING: {
          title: "Status diperbarui",
          description: `Status verifikasi ${request.user.name} berhasil diperbarui.`,
        },
      };
      toast.success(toastCopy[status]);
    } catch (decisionError) {
      const errorMessage = decisionError instanceof Error ? decisionError.message : "Gagal memperbarui status verifikasi";
      setError(errorMessage);
      toast.error({
        title: "Gagal memperbarui verifikasi",
        description: errorMessage,
      });
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
            onClick={() => fetchRequests(statusFilter, debouncedSearch)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        <AdminSearch
          value={search}
          onChange={setSearch}
          placeholder="Cari nama, email, NIK, telepon, alamat, role, status, atau catatan..."
          className="mt-6 max-w-2xl"
        />

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

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (sortBy === "submissionTime") {
                  setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                } else {
                  setSortBy("submissionTime");
                  setSortDirection("desc");
                }
              }}
              className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-bold transition ${
                sortBy === "submissionTime"
                  ? "border-[#07B0C8] bg-[#F0FBFD] text-[#07B0C8]"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Waktu Pengajuan {sortBy === "submissionTime" && (sortDirection === "asc" ? "↑" : "↓")}
            </button>
            <button
              type="button"
              onClick={() => {
                if (sortBy === "updateTime") {
                  setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                } else {
                  setSortBy("updateTime");
                  setSortDirection("desc");
                }
              }}
              className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-bold transition ${
                sortBy === "updateTime"
                  ? "border-[#07B0C8] bg-[#F0FBFD] text-[#07B0C8]"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Waktu Update {sortBy === "updateTime" && (sortDirection === "asc" ? "↑" : "↓")}
            </button>
            <button
              type="button"
              onClick={() => {
                if (sortBy === "type") {
                  setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                } else {
                  setSortBy("type");
                  setSortDirection("asc");
                }
              }}
              className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-bold transition ${
                sortBy === "type"
                  ? "border-[#07B0C8] bg-[#F0FBFD] text-[#07B0C8]"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Tipe Akun {sortBy === "type" && (sortDirection === "asc" ? "↑" : "↓")}
            </button>
          </div>
          {sortBy && (
            <button
              type="button"
              onClick={() => setSortBy(undefined)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition"
            >
              Hapus Sorting
            </button>
          )}
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
          {getSortedRequests().map((request) => {
            const key = requestKey(request);
            const isVerified = request.verificationStatus === "VERIFIED";
            return (
              <article key={key} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-extrabold text-slate-900">{request.user.name}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${roleBadgeClassName[request.role]}`}>
                        {request.roleLabel}
                      </span>
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
                    {request.missingIdentityLabels.length > 0 && (
                      <p className="mt-3 text-sm font-bold text-red-600">
                        Data identitas kurang: {request.missingIdentityLabels.join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 rounded-lg border border-gray-200 bg-[#F8FAFC] p-4">
                  <div className="text-sm font-bold text-slate-900">Data Identitas</div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <IdentityItem icon={<IdCard size={17} />} label="NIK" value={request.user.nik} />
                    <IdentityItem icon={<Phone size={17} />} label="No. Telepon" value={request.user.phone_number} />
                    <IdentityItem icon={<MapPin size={17} />} label="Alamat" value={request.user.address} />
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
                      onChange={(event) => {
                        setMessages((current) => ({ ...current, [key]: event.target.value }));
                        if (messageErrors[key]) {
                          setMessageErrors((current) => {
                            const next = { ...current };
                            delete next[key];
                            return next;
                          });
                        }
                      }}
                      disabled={isVerified}
                      className={`min-h-22 rounded-lg border px-3 py-2 text-sm font-medium outline-none transition focus:border-[#07B0C8] focus:ring-3 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${
                        messageErrors[key] ? "border-red-300 bg-red-50 focus:ring-red-100" : "border-gray-200"
                      }`}
                      placeholder="Contoh: Foto KTP buram, mohon upload ulang bagian depan KTP."
                    />
                    {messageErrors[key] && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                        {messageErrors[key]}
                      </div>
                    )}
                  </label>

                  <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                    <button
                      type="button"
                      onClick={() => handleDecision(request, "VERIFIED")}
                      disabled={isVerified || Boolean(submittingKey) || request.missingDocumentLabels.length > 0 || request.missingIdentityLabels.length > 0}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      <ShieldCheck size={16} />
                      Verifikasi
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(request, "REVISION_REQUESTED")}
                      disabled={isVerified || Boolean(submittingKey)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <Clock size={16} />
                      Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(request, "REJECTED")}
                      disabled={isVerified || Boolean(submittingKey)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
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
