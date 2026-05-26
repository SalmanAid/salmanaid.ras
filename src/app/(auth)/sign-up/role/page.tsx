"use client"

import Link from "next/link";
import Image from "next/image";
import { type ReactNode, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileText, IdCard, MapPin, Phone, Upload, UserRound } from "lucide-react";

import HeartBlueIcon from "../../../../../public/heart-blue.svg"
import GraduationCapIcon from "../../../../../public/graduation-cap.svg"
import { useUserSignUpStore } from "@/hooks/userSignupStore";

type DocumentKey = "identityCard" | "institutionCard" | "familyCard";
type SignUpStep = "role" | "identity" | "documents";
type IdentityForm = {
    name: string;
    nik: string;
    phone_number: string;
    address: string;
};

const DOCUMENT_REQUIREMENTS: Record<string, { key: DocumentKey; label: string; helper: string }[]> = {
    DONOR: [
        { key: "identityCard", label: "KTP", helper: "Upload foto/scan KTP yang jelas." },
    ],
    BORROWER: [
        { key: "identityCard", label: "KTP", helper: "Upload foto/scan KTP yang jelas." },
        { key: "institutionCard", label: "Kartu Identitas Instansi", helper: "KTM, Kartu Tanda Dosen, atau identitas instansi lain." },
        { key: "familyCard", label: "Kartu Keluarga", helper: "Upload KK terbaru yang terbaca." },
    ],
};

function formatFileSize(size: number) {
    if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentPicker({
    label,
    helper,
    file,
    onChange,
}: {
    label: string;
    helper: string;
    file: File | null;
    onChange: (file: File) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F0FBFD] text-[#07B0C8]">
                    <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-900">{label}</div>
                    <div className="mt-0.5 text-xs leading-5 text-gray-500">{helper}</div>
                    {file && (
                        <div className="mt-2 grid min-w-0 max-w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 size={15} className="shrink-0" />
                            <span className="block min-w-0 truncate" title={file.name}>{file.name}</span>
                            <span className="shrink-0 text-emerald-600/80">{formatFileSize(file.size)}</span>
                        </div>
                    )}
                </div>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={(event) => {
                    const selectedFile = event.target.files?.[0];
                    if (selectedFile) onChange(selectedFile);
                }}
            />

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#07B0C8]/30 bg-[#F0FBFD] text-xs font-bold text-[#078EA2] transition hover:bg-[#E3F8FC]"
            >
                <Upload size={15} />
                {file ? "Ganti Dokumen" : "Upload Dokumen"}
            </button>
        </div>
    );
}

function IdentityField({
    label,
    required = true,
    icon,
    children,
}: {
    label: string;
    required?: boolean;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
            <span className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0FBFD] text-[#07B0C8]">
                    {icon}
                </span>
                {label} {required && <span className="text-red-500">*</span>}
            </span>
            {children}
        </label>
    );
}

export default function ChooseRolePage() {
    const router = useRouter();

    // init variables
    const role = useUserSignUpStore((state) => (state.role))
    const email = useUserSignUpStore((state) => (state.user?.email))
    const password = useUserSignUpStore((state) => (state.password))
    const setRole = useUserSignUpStore((state) => (state.setRole))
    const clearUserSignUpStore = useUserSignUpStore((state) => (state.clear))

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [step, setStep] = useState<SignUpStep>("role");
    const [identity, setIdentity] = useState<IdentityForm>({
        name: "",
        nik: "",
        phone_number: "",
        address: "",
    });
    const [documents, setDocuments] = useState<Record<DocumentKey, File | null>>({
        identityCard: null,
        institutionCard: null,
        familyCard: null,
    });

    const hasSelectedRole = role === "DONOR" || role === "BORROWER";
    const requiredDocuments = hasSelectedRole ? DOCUMENT_REQUIREMENTS[role] || [] : [];

    const setDocument = (key: DocumentKey, file: File) => {
        setDocuments((current) => ({
            ...current,
            [key]: file,
        }));
        setError(null);
    };

    const getTrimmedIdentity = () => ({
        name: identity.name.trim(),
        nik: identity.nik.trim(),
        phone_number: identity.phone_number.trim(),
        address: identity.address.trim(),
    });

    const validateIdentity = () => {
        const trimmedIdentity = getTrimmedIdentity();

        if (!trimmedIdentity.name || !trimmedIdentity.nik || !trimmedIdentity.phone_number || !trimmedIdentity.address) {
            setError("Nama, NIK, No. Telepon, dan Alamat harus diisi.");
            return false;
        }

        if (!/^\d{16}$/.test(trimmedIdentity.nik)) {
            setError("NIK harus terdiri dari 16 digit angka.");
            return false;
        }

        if (!/^\+?[0-9\s-]{8,30}$/.test(trimmedIdentity.phone_number)) {
            setError("No. Telepon harus 8-30 karakter dan hanya berisi angka, spasi, tanda +, atau tanda -.");
            return false;
        }

        if (trimmedIdentity.address.length < 10) {
            setError("Alamat minimal 10 karakter.");
            return false;
        }

        return true;
    };

    const handleContinueToIdentity = () => {
        setError(null);

        if (!hasSelectedRole) {
            setError("Pilih role terlebih dahulu.");
            return;
        }

        if (!email || !password) {
            setError("Email dan password tidak ditemukan. Silakan ulangi pendaftaran.");
            return;
        }

        setStep("identity");
    };

    const handleContinueToDocuments = () => {
        setError(null);

        if (!validateIdentity()) {
            return;
        }

        setStep("documents");
    };

    // functions for submit actions
    const handleUserRoleSubmission = async () => {
        setError(null);

        if (!role || !email || !password) {
            setError("Email, Password, dan Role harus dipilih.");
            return;
        }

        if (!validateIdentity()) {
            return;
        }

        const missingDocuments = requiredDocuments.filter((document) => !documents[document.key]);
        if (missingDocuments.length > 0) {
            setError(`Lengkapi dokumen: ${missingDocuments.map((document) => document.label).join(", ")}.`);
            return;
        }

        setLoading(true);

        try {
            const trimmedIdentity = getTrimmedIdentity();
            const formData = new FormData();
            formData.append("email", email);
            formData.append("password", password);
            formData.append("name", trimmedIdentity.name);
            formData.append("nik", trimmedIdentity.nik);
            formData.append("phone_number", trimmedIdentity.phone_number);
            formData.append("address", trimmedIdentity.address);
            formData.append("role", role);

            requiredDocuments.forEach((document) => {
                const file = documents[document.key];
                if (file) {
                    formData.append(document.key, file);
                }
            });

            const res = await fetch("/api/auth/register", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Registrasi gagal.");
                setLoading(false);
            } else {
                
                // clean up the variabel
                clearUserSignUpStore()
                
                // Success, redirect to login
                router.push("/login");
            }
        } catch (err) {
            console.error("Register error:", err);
            setError("Terjadi kesalahan sistem.");
            setLoading(false);
        }
    };

    return (
        // main container
        <div className="font-sans flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden overflow-y-auto px-4 py-10 relative">
            <Image
                src="/auth-bg.svg"
                alt=""
                fill
                className="object-cover -z-10"
                priority
            />

            {/* rumah amal salman logo */}
            <div className="flex relative w-full justify-center items-center mb-8">
                <Image
                    src="/rumah-amal-logo.svg"
                    alt="Logo Rumah Amal Salman"
                    width={200}
                    height={100}
                    priority
                />
            </div>

            {/* login container */}
            <div className="flex w-full justify-center items-center">

                <div className={`border border-black/20 bg-white p-6 sm:p-8 w-full rounded-2xl shadow-2xl flex flex-col gap-6 ${step === "documents" ? "max-w-2xl" : step === "identity" ? "max-w-xl" : "max-w-md"}`}>

                    {/* greeting container */}
                    <div className="grid justify-center items-center gap-y-2 text-center">
                        {/* greeting caption container */}
                        <div className="text-lg font-bold">
                            {step === "role" ? (
                                <>Selamat Datang! <span className="text-[#16C5DE]">Pilih Peran Anda</span></>
                            ) : step === "identity" ? (
                                <>Lengkapi <span className="text-[#16C5DE]">Identitas Diri</span></>
                            ) : (
                                <>Lengkapi <span className="text-[#16C5DE]">Dokumen Identitas</span></>
                            )}
                        </div>

                        {/* sub greeting container */}
                        <div className="text-sm text-gray-500" >
                            {step === "role"
                                ? "Pilih peran utama Anda untuk menyesuaikan pengalaman dashboard. Anda dapat menambahkan peran lain nanti."
                                : step === "identity"
                                    ? "Data ini membantu admin mencocokkan identitas dengan dokumen yang Anda unggah."
                                : "Akun akan masuk antrean verifikasi admin setelah pendaftaran selesai."}
                        </div>

                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs font-bold">
                        <span className={`rounded-full px-3 py-1 ${step === "role" ? "bg-[#F0FBFD] text-[#07B0C8]" : "bg-emerald-50 text-emerald-700"}`}>
                            1. Role
                        </span>
                        <span className="h-px w-8 bg-gray-200" />
                        <span className={`rounded-full px-3 py-1 ${step === "identity" ? "bg-[#F0FBFD] text-[#07B0C8]" : step === "documents" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                            2. Identitas
                        </span>
                        <span className="h-px w-8 bg-gray-200" />
                        <span className={`rounded-full px-3 py-1 ${step === "documents" ? "bg-[#F0FBFD] text-[#07B0C8]" : "bg-gray-100 text-gray-400"}`}>
                            3. Dokumen
                        </span>
                    </div>

                    {step === "role" && (
                        <>
                            {/* option role container */}
                            <div className="flex justify-center items-stretch w-full gap-4">

                                {/* Donatur container */}
                                <div 
                                    className={`flex flex-col w-[50%] border border-solid rounded-2xl p-4 cursor-pointer transition-all duration-300 transform
                                        ${role === "DONOR" 
                                            ? "bg-[#16C5DE]/10 border-[#16C5DE] -translate-y-2 shadow-xl ring-2 ring-[#16C5DE]/50" 
                                            : "bg-white border-gray-300 hover:border-gray-400 hover:-translate-y-0.5 hover:shadow-md"
                                        }`} 
                                    onClick={() => setRole("DONOR")}
                                >
                                    {/* love sign */}
                                    <div className="flex w-full h-fit p-2 justify-center items-center">
                                        <Image 
                                            src={HeartBlueIcon}
                                            alt="Donor Icon"
                                        />
                                    </div>

                                    {/* Title */}
                                    <div className={`flex w-full h-fit p-2 justify-center items-center font-bold transition-colors
                                        ${role === "DONOR" ? "text-[#16C5DE]" : "text-black"}`}
                                    >
                                        Donatur
                                    </div>

                                    {/* caption */}
                                    <div className="flex w-full h-fit p-2 justify-center items-center text-center text-sm text-gray-500">
                                        Saya ingin menyalurkan bantuan dana
                                    </div>
                                </div>

                                {/* Peminjam container */}
                                <div 
                                    className={`flex flex-col w-[50%] border border-solid rounded-2xl p-4 cursor-pointer transition-all duration-300 transform
                                        ${role === "BORROWER" 
                                            ? "bg-[#FCB82E]/10 border-[#FCB82E] -translate-y-2 shadow-xl ring-2 ring-[#FCB82E]/50" 
                                            : "bg-white border-gray-300 hover:border-gray-400 hover:-translate-y-0.5 hover:shadow-md"
                                        }`} 
                                    onClick={() => setRole("BORROWER")}
                                >
                                    {/* graduation cap sign */}
                                    <div className="flex w-full h-fit p-2 justify-center items-center">
                                        <Image 
                                            src={GraduationCapIcon}
                                            alt="Applicant Icon"
                                        />
                                    </div>

                                    {/* Title */}
                                    <div className={`flex w-full h-fit p-2 justify-center items-center font-bold transition-colors
                                        ${role === "BORROWER" ? "text-[#FCB82E]" : "text-black"}`}
                                    >
                                        Peminjam
                                    </div>

                                    {/* caption */}
                                    <div className="flex w-full h-fit p-2 justify-center items-center text-center text-sm text-gray-500">
                                        Saya membutuhkan bantuan dana pendidikan
                                    </div>
                                </div>    

                            </div>

                            <button
                                type="button"
                                onClick={handleContinueToIdentity}
                                className="bg-[#16C5DE] h-12 flex justify-center items-center rounded-xl text-white font-bold hover:bg-[#13A6BB] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                Lanjut Isi Identitas
                            </button>
                        </>
                    )}

                    {step === "identity" && (
                        <div className="rounded-2xl border border-gray-200 bg-[#F8FAFC] p-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <IdentityField label="Nama Lengkap" icon={<UserRound size={16} />}>
                                    <input
                                        value={identity.name}
                                        onChange={(event) => {
                                            setIdentity((current) => ({ ...current, name: event.target.value }));
                                            setError(null);
                                        }}
                                        className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#07B0C8] focus:ring-3 focus:ring-cyan-100"
                                        placeholder="Masukkan nama lengkap"
                                        disabled={loading}
                                    />
                                </IdentityField>

                                <IdentityField label="NIK" icon={<IdCard size={16} />}>
                                    <input
                                        inputMode="numeric"
                                        value={identity.nik}
                                        onChange={(event) => {
                                            const nextNik = event.target.value.replace(/\D/g, "").slice(0, 16);
                                            setIdentity((current) => ({ ...current, nik: nextNik }));
                                            setError(null);
                                        }}
                                        className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#07B0C8] focus:ring-3 focus:ring-cyan-100"
                                        placeholder="16 digit NIK"
                                        disabled={loading}
                                    />
                                </IdentityField>

                                <IdentityField label="No. Telepon" icon={<Phone size={16} />}>
                                    <input
                                        value={identity.phone_number}
                                        onChange={(event) => {
                                            setIdentity((current) => ({ ...current, phone_number: event.target.value }));
                                            setError(null);
                                        }}
                                        className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#07B0C8] focus:ring-3 focus:ring-cyan-100"
                                        placeholder="Contoh: 081234567890"
                                        disabled={loading}
                                    />
                                </IdentityField>

                                <IdentityField label="Alamat" icon={<MapPin size={16} />}>
                                    <textarea
                                        value={identity.address}
                                        onChange={(event) => {
                                            setIdentity((current) => ({ ...current, address: event.target.value }));
                                            setError(null);
                                        }}
                                        className="min-h-24 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#07B0C8] focus:ring-3 focus:ring-cyan-100"
                                        placeholder="Masukkan alamat domisili"
                                        disabled={loading}
                                    />
                                </IdentityField>
                            </div>
                        </div>
                    )}

                    {step === "documents" && (
                        <div className="rounded-2xl border border-gray-200 bg-[#F8FAFC] p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-sm font-bold text-slate-900">
                                        Upload Dokumen Identitas
                                    </div>
                                    <p className="mt-1 text-xs leading-5 text-gray-500">
                                        Akun akan masuk antrean verifikasi admin setelah pendaftaran selesai.
                                    </p>
                                </div>
                                <div className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#07B0C8]">
                                    {requiredDocuments.length} wajib
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3">
                                {requiredDocuments.map((document) => (
                                    <DocumentPicker
                                        key={document.key}
                                        label={document.label}
                                        helper={document.helper}
                                        file={documents[document.key]}
                                        onChange={(file) => setDocument(document.key, file)}
                                    />
                                ))}
                            </div>

                            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium leading-5 text-amber-800">
                                Gunakan file JPG, PNG, atau PDF maksimal 10MB. Pastikan semua tulisan terlihat jelas.
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {step === "identity" && (
                        <div className="flex flex-col-reverse items-stretch justify-center w-full gap-2 mt-2 sm:flex-row sm:items-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setError(null);
                                    setStep("role");
                                }}
                                disabled={loading}
                                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 font-bold text-slate-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <ArrowLeft size={18} />
                                Kembali
                            </button>
                            <button
                                type="button"
                                onClick={handleContinueToDocuments}
                                disabled={loading}
                                className="bg-[#16C5DE] flex-1 h-12 flex justify-center items-center rounded-xl text-white font-bold hover:bg-[#13A6BB] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                Lanjut Upload Dokumen
                            </button>
                        </div>
                    )}

                    {step === "documents" && (
                        /* submit buttons container */
                        <div className="flex flex-col-reverse items-stretch justify-center w-full gap-2 mt-2 sm:flex-row sm:items-center">

                            <button
                                type="button"
                                onClick={() => {
                                    setError(null);
                                    setStep("identity");
                                }}
                                disabled={loading}
                                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 font-bold text-slate-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <ArrowLeft size={18} />
                                Kembali
                            </button>

                            {/* sign up container */}
                            <button
                                onClick={handleUserRoleSubmission}
                                disabled={loading}
                                className="bg-[#16C5DE] flex-1 h-12 flex justify-center items-center rounded-xl text-white font-bold hover:bg-[#13A6BB] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? "Loading..." : "Selesaikan Pendaftaran"}
                            </button>

                        </div>
                    )}

                    {/* minimal caption */}
                    <div className="text-xs flex items-center justify-center text-black/40 text-center mt-4">
                        Sudah Punya Akun? <Link href="/login" className="text-[#16C5DE] font-bold underline ml-1">Log In</Link>
                    </div>

                </div>

            </div>

        </div>
    );
}
