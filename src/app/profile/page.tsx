"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, Save, Upload } from "lucide-react";

import RoleAwareUserNavbar from "@/components/ui/role-aware-user-navbar";

type DocumentType = "identityCard" | "institutionCard" | "familyCard";

type AccountRole = {
  role: string;
  label: string;
  verificationStatus: string;
  verificationMessage?: string | null;
  missingDocumentLabels?: string[];
  missingIdentityLabels?: string[];
};

type AccountDocument = {
  type: DocumentType;
  label: string;
  uploadedAt: string | null;
  signedUrl: string | null;
  isUploaded: boolean;
};

type AccountOverview = {
  user: {
    name: string;
    email: string;
    nik?: string | null;
    phone_number?: string | null;
    address?: string | null;
  };
  roles: AccountRole[];
  documents: AccountDocument[];
};

const statusClassName: Record<string, string> = {
  VERIFIED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  REVISION_REQUESTED: "border-orange-200 bg-orange-50 text-orange-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
};

function formatDate(value?: string | null) {
  if (!value) return "Belum diupload";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function DocumentRow({
  document,
  onUploaded,
}: {
  document: AccountDocument;
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("documentType", document.type);
      formData.append("file", file);

      const response = await fetch("/api/user/documents", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Gagal upload dokumen");
      }

      onUploaded();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Gagal upload dokumen");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F0FBFD] text-[#07B0C8]">
            <FileText size={19} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900">{document.label}</div>
            <div className="mt-1 text-xs font-medium text-gray-500">
              {formatDate(document.uploadedAt)}
            </div>
            {document.signedUrl && (
              <a
                href={document.signedUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex text-xs font-bold text-[#07B0C8] hover:underline"
              >
                Lihat dokumen
              </a>
            )}
            {error && <div className="mt-2 text-xs font-semibold text-red-600">{error}</div>}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleUpload(file);
          }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#07B0C8]/30 bg-[#F0FBFD] px-4 text-sm font-bold text-[#078EA2] transition hover:bg-[#E3F8FC] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload size={16} />
          {isUploading ? "Mengupload..." : document.isUploaded ? "Ganti" : "Upload"}
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [overview, setOverview] = useState<AccountOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [profileForm, setProfileForm] = useState({
    name: "",
    nik: "",
    phone_number: "",
    address: "",
  });

  const loadOverview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/me", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Gagal memuat profil");

      setOverview(payload.data);
      setProfileForm({
        name: payload.data.user.name || "",
        nik: payload.data.user.nik || "",
        phone_number: payload.data.user.phone_number || "",
        address: payload.data.user.address || "",
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat profil");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOverview();
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileForm.name,
          nik: profileForm.nik || null,
          phone_number: profileForm.phone_number || null,
          address: profileForm.address || null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Gagal menyimpan profil");

      setOverview(payload.data);
      setMessage("Profil berhasil diperbarui.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan profil");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <RoleAwareUserNavbar />

      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-6">
        <header>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Profil Akun</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Kelola data kontak dan dokumen identitas yang dipakai untuk verifikasi role akun.
          </p>
        </header>

        {isLoading && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 text-sm font-semibold text-gray-500">
            Memuat profil...
          </div>
        )}

        {!isLoading && overview && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="space-y-6">
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-slate-900">Data Pribadi</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    Nama
                    <input
                      value={profileForm.name}
                      onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                      className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none transition focus:border-[#07B0C8] focus:ring-3 focus:ring-cyan-100"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    Email
                    <input
                      value={overview.user.email}
                      disabled
                      className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    No. Telepon
                    <input
                      value={profileForm.phone_number}
                      onChange={(event) => setProfileForm((current) => ({ ...current, phone_number: event.target.value }))}
                      className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none transition focus:border-[#07B0C8] focus:ring-3 focus:ring-cyan-100"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    NIK
                    <input
                      inputMode="numeric"
                      value={profileForm.nik}
                      onChange={(event) => {
                        const nextNik = event.target.value.replace(/\D/g, "").slice(0, 16);
                        setProfileForm((current) => ({ ...current, nik: nextNik }));
                      }}
                      className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none transition focus:border-[#07B0C8] focus:ring-3 focus:ring-cyan-100"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
                    Alamat
                    <textarea
                      value={profileForm.address}
                      onChange={(event) => setProfileForm((current) => ({ ...current, address: event.target.value }))}
                      className="min-h-24 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-[#07B0C8] focus:ring-3 focus:ring-cyan-100"
                    />
                  </label>
                </div>

                {(message || error) && (
                  <div className={`mt-4 rounded-lg px-3 py-2 text-sm font-semibold ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {error || message}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#07B0C8] px-4 text-sm font-bold text-white transition hover:bg-[#069CB1] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={16} />
                  {isSaving ? "Menyimpan..." : "Simpan Profil"}
                </button>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-slate-900">Dokumen Identitas</h2>
                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Mengganti dokumen akan membuat role terkait menunggu verifikasi ulang.
                </p>
                <div className="mt-4 grid gap-3">
                  {overview.documents.map((document) => (
                    <DocumentRow
                      key={document.type}
                      document={document}
                      onUploaded={loadOverview}
                    />
                  ))}
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-slate-900">Status Role</h2>
                <div className="mt-4 space-y-3">
                  {overview.roles.map((role) => (
                    <div key={role.role} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-bold text-slate-900">{role.label}</div>
                        <div className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClassName[role.verificationStatus] || "border-gray-200 bg-gray-50 text-gray-600"}`}>
                          {role.verificationStatus}
                        </div>
                      </div>
                      {role.verificationMessage && (
                        <p className="mt-2 text-xs leading-5 text-slate-600">{role.verificationMessage}</p>
                      )}
                      {(role.missingDocumentLabels || []).length > 0 && (
                        <p className="mt-2 text-xs font-semibold leading-5 text-red-600">
                          Kurang: {role.missingDocumentLabels?.join(", ")}
                        </p>
                      )}
                      {(role.missingIdentityLabels || []).length > 0 && (
                        <p className="mt-2 text-xs font-semibold leading-5 text-red-600">
                          Data identitas kurang: {role.missingIdentityLabels?.join(", ")}
                        </p>
                      )}
                      {role.verificationStatus === "VERIFIED" && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 size={14} />
                          Siap digunakan
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
