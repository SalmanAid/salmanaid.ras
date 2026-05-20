"use client"

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

import HeartBlueIcon from "../../../../../public/heart-blue.svg"
import GraduationCapIcon from "../../../../../public/graduation-cap.svg"
import { useUserSignUpStore } from "@/hooks/userSignupStore";

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

    // functions for submit actions
    const handleUserRoleSubmission = async () => {
        setError(null);

        if (!role || !email || !password) {
            setError("Email, Password, dan Role harus dipilih.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password,
                    name: email.split('@')[0], // Default name from email part
                    role:  role
                }),
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
        <div className="font-sans flex flex-col w-full min-h-screen overflow-hidden items-center justify-center relative">
            <Image
                src="/auth-bg.svg"
                alt=""
                fill
                className="object-cover -z-10"
                priority
            />

            {/* rumah amal salman logo */}
            <div className="flex relative w-full justify-center items-center h-[30%] mb-8">
                <Image
                    src="/rumah-amal-logo.svg"
                    alt="Logo Rumah Amal Salman"
                    width={200}
                    height={100}
                    priority
                />
            </div>

            {/* login container */}
            <div className="flex w-full justify-center items-center px-4">

                <div className="border border-black/20 bg-white p-8 w-full max-w-md rounded-2xl shadow-2xl flex flex-col gap-6">

                    {/* greeting container */}
                    <div className="grid justify-center items-center gap-y-2 text-center">
                        {/* greeting caption container */}
                        <div className="text-lg font-bold">
                            Selamat Datang! <span className="text-[#16C5DE]">Pilih Peran Anda</span>
                        </div>

                        {/* sub greeting container */}
                        <div className="text-sm text-gray-500" >
                            Pilih peran utama Anda untuk menyesuaikan pengalaman dashboard. Anda dapat menambahkan peran lain nanti.
                        </div>

                    </div>


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

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* submit buttons container */}
                    <div className="flex items-center justify-center w-full gap-x-2 mt-2">

                        {/* sign up container */}
                        <button
                            onClick={handleUserRoleSubmission}
                            disabled={loading}
                            className="bg-[#16C5DE] flex-1 h-12 flex justify-center items-center rounded-xl text-white font-bold hover:bg-[#13A6BB] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? "Loading..." : "Selesaikan Pendaftaran"}
                        </button>

                    </div>

                    {/* minimal caption */}
                    <div className="text-xs flex items-center justify-center text-black/40 text-center mt-4">
                        Sudah Punya Akun? <Link href="/login" className="text-[#16C5DE] font-bold underline ml-1">Log In</Link>
                    </div>

                </div>

            </div>

        </div>
    );
}
