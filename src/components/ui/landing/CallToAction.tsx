'use client';

import Link from 'next/link';
import { ArrowRight, GraduationCap, Heart } from 'lucide-react';

export const CallToAction = () => {
  return (
    <section className="bg-[#F3F4F6] py-16 md:py-20">
      <div className="max-w-8xl mx-auto px-3 sm:px-5 lg:px-8 -mt-2 md:-mt-4">
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#07B0C8] to-[#06a1b8] px-8 py-14 md:px-14 md:py-16 text-center text-white shadow-lg">
          <div className="pointer-events-none absolute -left-10 -bottom-14 h-44 w-44 rounded-full bg-white/8" />
          <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/8" />

          <h2 className="text-xl md:text-[52px] font-bold mb-4">Siap Untuk Menjadi Agen Perubahan?</h2>

          <p className="text-cyan-50 text-sm md:text-[15px] mb-9 max-w-4xl mx-auto leading-relaxed">
            Baik Anda ingin mendukung masa depan seorang siswa atau membutuhkan bantuan keuangan untuk pendidikan Anda, Rumah Amal Salman siap membantu Anda. Bergabunglah dengan komunitas penggerak perubahan kami yang terus berkembang.
          </p>

          <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/donor/donate-form"
              className="bg-[#FCB82E] hover:bg-[#e8a91f] text-[#111827] font-semibold px-7 py-3 rounded-full transition-all inline-flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Lakukan Donasi
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/applicant/apply"
              className="border border-white hover:bg-white hover:text-[#07B0C8] text-white font-semibold px-7 py-3 rounded-full transition-all inline-flex items-center justify-center gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              Ajukan Pinjaman
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
