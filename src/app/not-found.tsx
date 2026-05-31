/**
 * 404 NOT FOUND TEMPLATE
 * Minimalist 404 handler for the whole application.
 */

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-white">
      <div className="flex flex-col items-center max-w-md text-center">
        
        {/* Responsive Heading */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-gray-950">
          404 - Halaman Tidak Ditemukan
        </h1>
        
        {/* Responsive Paragraph Description */}
        <p className="mt-3 text-[13.5px] sm:text-sm md:text-base text-gray-500 leading-relaxed">
          Halaman yang Anda tuju tidak ditemukan, sudah dipindahkan, atau sedang dalam perawatan.
        </p>
        
        {/* Adaptive Button Layout */}
        <div className="mt-6 w-full sm:w-auto">
          <Link 
            href="/" 
            className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-full bg-[#07B0C8] px-6 text-[13px] font-medium text-white transition hover:bg-[#0699AE] shadow-sm"
          >
            Kembali ke Halaman Landing
          </Link>
        </div>

      </div>
    </div>
  );
}