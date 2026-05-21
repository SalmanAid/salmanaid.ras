"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, FileText, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import RumahAmalHorizontalLogo from "../../../../public/rumah-amal-horizontal-logo.svg";

type RoleName = "DONOR" | "BORROWER";
type DocumentKey = "identityCard" | "institutionCard" | "familyCard";

const ROLE_OPTIONS: { role: RoleName; label: string; dashboard: string }[] = [
  { role: "DONOR", label: "Donatur", dashboard: "/donor/dashboard" },
  { role: "BORROWER", label: "Peminjam", dashboard: "/applicant/dashboard" },
];

const REQUIRED_DOCUMENTS: Record<RoleName, { key: DocumentKey; label: string; helper: string }[]> = {
  DONOR: [
    { key: "identityCard", label: "KTP", helper: "Dokumen identitas utama untuk donatur." },
  ],
  BORROWER: [
    { key: "identityCard", label: "KTP", helper: "Dokumen identitas utama peminjam." },
    { key: "institutionCard", label: "Kartu Identitas Instansi", helper: "KTM, Kartu Tanda Dosen, atau kartu instansi lain." },
    { key: "familyCard", label: "Kartu Keluarga", helper: "Dokumen KK yang terbaca jelas." },
  ],
};

type AccountOverview = {
  roles: { role: string; label: string; verificationStatus: string }[];
  documents: { type: DocumentKey; isUploaded: boolean; uploadedAt: string | null }[];
};

function UploadRow({
  label,
  helper,
  alreadyUploaded,
  file,
  onChange,
}: {
  label: string;
  helper: string;
  alreadyUploaded: boolean;
  file: File | null;
  onChange: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isComplete = alreadyUploaded || Boolean(file);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isComplete ? "bg-emerald-50 text-emerald-600" : "bg-[#F0FBFD] text-[#07B0C8]"}`}>
            {isComplete ? <CheckCircle2 size={19} /> : <FileText size={19} />}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900">{label}</div>
            <p className="mt-1 text-xs leading-5 text-gray-500">{helper}</p>
            <p
              className={`mt-2 max-w-full truncate text-xs font-bold ${isComplete ? "text-emerald-700" : "text-amber-700"}`}
              title={file?.name}
            >
              {file ? file.name : alreadyUploaded ? "Sudah tersedia di akun" : "Belum tersedia"}
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) onChange(selected);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#07B0C8]/30 bg-[#F0FBFD] px-4 text-sm font-bold text-[#078EA2] transition hover:bg-[#E3F8FC]"
        >
          <Upload size={16} />
          {isComplete ? "Ganti" : "Upload"}
        </button>
      </div>
    </div>
  );
}

export default function AccountRolesPage() {
  const [selectedRole, setSelectedRole] = useState<RoleName>(() => {
    if (typeof window === "undefined") return "BORROWER";

    const roleParam = new URLSearchParams(window.location.search).get("role");
    return roleParam === "DONOR" || roleParam === "BORROWER" ? roleParam : "BORROWER";
  });
  const [overview, setOverview] = useState<AccountOverview | null>(null);
  const [files, setFiles] = useState<Record<DocumentKey, File | null>>({
    identityCard: null,
    institutionCard: null,
    familyCard: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadOverview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/me", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Gagal memuat akun");
      setOverview(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat akun");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOverview();
  }, []);

  const existingRole = overview?.roles.find((role) => role.role === selectedRole);
  const requirements = REQUIRED_DOCUMENTS[selectedRole];
  const documentStatus = useMemo(() => {
    const map = new Map<DocumentKey, boolean>();
    overview?.documents.forEach((document) => map.set(document.type, document.isUploaded));
    return map;
  }, [overview]);
  const isComplete = requirements.every((document) => documentStatus.get(document.key) || files[document.key]);
  const selectedRoleMeta = ROLE_OPTIONS.find((option) => option.role === selectedRole) || ROLE_OPTIONS[0];

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    if (!isComplete) {
      setError("Lengkapi dokumen yang masih kurang terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("role", selectedRole);
      requirements.forEach((document) => {
        const file = files[document.key];
        if (file) formData.append(document.key, file);
      });

      const response = await fetch("/api/user/roles", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Gagal mendaftarkan role");

      setMessage("Role berhasil didaftarkan dan menunggu verifikasi admin.");
      await loadOverview();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gagal mendaftarkan role");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex h-14.5 max-w-350 items-center justify-between px-5 sm:px-6">
          <Link href="/profile" className="flex items-center">
            <Image src={RumahAmalHorizontalLogo} alt="Rumah Amal Salman" width={122} height={30} className="h-7 w-auto" />
          </Link>
          <Link href="/profile" className="text-sm font-bold text-[#07B0C8] hover:underline">Profil</Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Daftar Role Tambahan</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Dokumen yang sudah ada akan dipakai ulang. Lengkapi hanya dokumen yang belum tersedia.
        </p>

        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option.role}
                type="button"
                onClick={() => setSelectedRole(option.role)}
                className={`rounded-lg border px-4 py-3 text-left transition ${selectedRole === option.role ? "border-[#07B0C8] bg-[#F0FBFD] text-[#078EA2]" : "border-gray-200 bg-white text-slate-700 hover:bg-gray-50"}`}
              >
                <div className="text-sm font-bold">{option.label}</div>
                <div className="mt-1 text-xs font-medium opacity-80">
                  {option.role === "DONOR" ? "Saya ingin melakukan donasi." : "Saya ingin mengajukan pinjaman."}
                </div>
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 text-sm font-semibold text-gray-500">
            Memuat data akun...
          </div>
        )}

        {!isLoading && existingRole && (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <div className="text-sm font-bold">Role {selectedRoleMeta.label} sudah ada di akun Anda.</div>
            <Link href={selectedRoleMeta.dashboard} className="mt-3 inline-flex text-sm font-bold text-emerald-700 hover:underline">
              Ganti ke dashboard {selectedRoleMeta.label}
            </Link>
          </div>
        )}

        {!isLoading && !existingRole && (
          <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">Dokumen untuk {selectedRoleMeta.label}</h2>
            <div className="mt-4 grid gap-3">
              {requirements.map((document) => (
                <UploadRow
                  key={document.key}
                  label={document.label}
                  helper={document.helper}
                  alreadyUploaded={Boolean(documentStatus.get(document.key))}
                  file={files[document.key]}
                  onChange={(file) => setFiles((current) => ({ ...current, [document.key]: file }))}
                />
              ))}
            </div>

            {(error || message) && (
              <div className={`mt-4 rounded-lg px-3 py-2 text-sm font-semibold ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                {error || message}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !isComplete}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-[#07B0C8] px-5 text-sm font-bold text-white transition hover:bg-[#069CB1] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSubmitting ? "Mendaftarkan..." : `Daftar sebagai ${selectedRoleMeta.label}`}
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
