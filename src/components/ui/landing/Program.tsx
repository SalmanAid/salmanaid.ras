"use client"

import Image from "next/image";
import HeartGoldIcon from "../../../../public/heart-gold.svg";
import GraduationHatGoldIcon from "../../../../public/graduation-hat-gold.svg";

import ProgramDetailComponent from "./ProgramDetail";
import { useState } from "react";

export default function ProgramComponent () {
    const [educationSupportIsOpen, setEducationSupportIsOpen] = useState<boolean>(false)
    const [flashDonationIsOpen, setFlashDonationIsOpen] = useState<boolean>(false) // Fixed typo from setFlashDonationtIsOpen

    return (
        <section className="pt-16 md:py-20 bg-[#F3F4F6] min-h-screen relative">

            {/* Backdrop & Popup Container for Education Program */}
            {educationSupportIsOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setEducationSupportIsOpen(false)} // Clicking the black backdrop closes it
                >
                    <ProgramDetailComponent 
                        title="Bantuan Dana Pendidikan" 
                        caption="Program Pendidikan Madani dirancang khusus untuk mendukung mahasiswa berprestasi yang membutuhkan bantuan finansial dalam menyelesaikan pendidikan mereka. Melalui program ini, kami berkomitmen untuk memastikan bahwa setiap mahasiswa memiliki kesempatan yang sama untuk meraih cita-cita mereka tanpa terbebani oleh kendala ekonomi.
                        Beasiswa ini mencakup bantuan biaya kuliah, uang saku bulanan, dan akses ke program pengembangan diri. Kami percaya bahwa investasi dalam pendidikan adalah investasi terbaik untuk masa depan bangsa, dan setiap mahasiswa yang berdedikasi layak mendapatkan kesempatan untuk berkembang." 
                        terms={[
                            "Mahasiswa aktif Institut Teknologi Bandung (ITB)", 
                            "IPK minimal 3.0 pada semester terakhir", 
                            "Sedang tidak menerima beasiswa dari sumber lain", 
                            "Mampu menunjukkan kebutuhan finansial dengan dokumen pendukung", 
                            "Aktif dalam kegiatan kemahasiswaan atau organisasi kampus"
                        ]}
                    />
                </div>
            )}

            {/* Backdrop & Popup Container for Flash Donation Program */}
            {flashDonationIsOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setFlashDonationIsOpen(false)} // Clicking the black backdrop closes it
                >
                    <ProgramDetailComponent 
                        title="Donasi Kilat Emergency" 
                        caption="Program Donasi Kilat adalah  adalah penggalangan dana darurat (rapid emergency crowdfunding) yang dibuat untuk merespons krisis atau bencana secara instan.
                        Tujuannya adalah mengumpulkan dana secara cepat agar bantuan langsung (seperti tenda, makanan, dan obat-obatan) dapat disalurkan segera kepada korban di masa tanggap darurat. " 
                        terms={[
                            "Mahasiswa aktif Institut Teknologi Bandung (ITB)", 
                            "IPK minimal 3.0 pada semester terakhir", 
                            "Sedang tidak menerima beasiswa dari sumber lain", 
                            "Mampu menunjukkan kebutuhan finansial dengan dokumen pendukung", 
                            "Aktif dalam kegiatan kemahasiswaan atau organisasi kampus"
                        ]}
                    />
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-14">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Program Kami</h2>
                    <div className="mx-auto mb-4 h-1 w-24 rounded-full bg-[#FCB82E]" />
                    <p className="text-gray-500 text-sm md:text-[15px] max-w-2xl mx-auto">
                       Berbagai program bantuan yang dirancang khusus untuk mendukung perjalanan pendidikan Anda
                    </p>
                </div>

                {/* Main Content Container */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {/* Bantuan Dana Pendidikan Card */}
                    <div className="flex flex-col p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <div className="p-3 rounded-2xl bg-[#FFF5DF] w-fit mb-4">
                            <Image src={GraduationHatGoldIcon} alt="Bantuan dana Pendidikan Icon" />
                        </div>
                        <h3 className="font-bold text-xl text-slate-800 mb-2">Bantuan Dana Pendidikan</h3>
                        <p className="text-slate-500 font-light text-sm leading-relaxed flex-1 mb-4">
                            Pinjaman bebas riba untuk biaya kuliah, buku, dan kebutuhan akademik lainnya dengan tenor fleksibel.
                        </p>
                        <button 
                            onClick={() => setEducationSupportIsOpen(true)}
                            className="w-fit font-bold text-[#FCB82E] text-sm hover:underline cursor-pointer text-left"
                        >
                            Pelajari Selengkapnya &rarr;
                        </button>
                    </div>

                    {/* Donasi Kilat Emergency Card */}
                    <div className="flex flex-col p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <div className="p-3 rounded-2xl bg-[#FFF5DF] w-fit mb-4">
                            <Image src={HeartGoldIcon} alt="Donasi Kilat Icon" />
                        </div>
                        <h3 className="font-bold text-xl text-slate-800 mb-2">Donasi Kilat Emergency</h3>
                        <p className="text-slate-500 font-light text-sm leading-relaxed flex-1 mb-4">
                            Bantuan cepat untuk mahasiswa yang menghadapi situasi darurat finansial dengan proses persetujuan 24 jam.
                        </p>
                        <button 
                            onClick={() => setFlashDonationIsOpen(true)}
                            className="w-fit font-bold text-[#FCB82E] text-sm hover:underline cursor-pointer text-left"
                        >
                            Pelajari Selengkapnya &rarr;
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}