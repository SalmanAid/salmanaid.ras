"use client"

import Drawer from "./Drawer";

export default function FAQComponent() {

    return (
        <section className="md:py-8 bg-[#F3F4F6]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Title */}
                <div className="text-center mb-14">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Pertanyaan yang Sering Diajukan
                    </h2>

                    {/* Caption */}
                    <p className="text-gray-500 text-sm md:text-[15px] max-w-2xl mx-auto">
                        Temukan jawaban atas pertanyaan umum tentang program kami
                    </p>
                </div>

                {/* faq drawers */}
                <div className="flex flex-col justify-center items-center w-full p-4">

                    {/* 1. Apakah benar tidak ada bunga sama sekali? */}
                    <div className="w-full flex justify-center items-center p-2">
                        <Drawer question="Apakah benar tidak ada bunga sama sekali?" answer="Ya, benar. SalmanAid beroperasi berdasarkan prinsip kebajikan (qardhul hasan). Kami tidak mengenakan bunga atau biaya tambahan apapun. Anda hanya perlu mengembalikan jumlah yang Anda pinjam."/>
                    </div>

                    {/* 2. Apakah benar tidak ada bunga sama sekali? */}
                    <div className="w-full flex justify-center items-center p-2">
                        <Drawer question="Bagaimana cara mengajukan pinjaman?" answer="Ya, benar. SalmanAid beroperasi berdasarkan prinsip kebajikan (qardhul hasan). Kami tidak mengenakan bunga atau biaya tambahan apapun. Anda hanya perlu mengembalikan jumlah yang Anda pinjam."/>
                    </div>

                    {/* 3. Apakah benar tidak ada bunga sama sekali? */}
                    <div className="w-full flex justify-center items-center p-2">
                        <Drawer question="Berapa lama tenor pembayaran yang tersedia?" answer="Ya, benar. SalmanAid beroperasi berdasarkan prinsip kebajikan (qardhul hasan). Kami tidak mengenakan bunga atau biaya tambahan apapun. Anda hanya perlu mengembalikan jumlah yang Anda pinjam."/>
                    </div>

                    {/* 4. Apakah benar tidak ada bunga sama sekali? */}
                    <div className="w-full flex justify-center items-center p-2">
                        <Drawer question="Bagaimana transparansi penggunaan donasi?" answer="Ya, benar. SalmanAid beroperasi berdasarkan prinsip kebajikan (qardhul hasan). Kami tidak mengenakan bunga atau biaya tambahan apapun. Anda hanya perlu mengembalikan jumlah yang Anda pinjam."/>
                    </div>

                    {/* 5. Apakah benar tidak ada bunga sama sekali? */}
                    <div className="w-full flex justify-center items-center p-2">
                        <Drawer question="Siapa saja yang bisa mengajukan bantuan?" answer="Ya, benar. SalmanAid beroperasi berdasarkan prinsip kebajikan (qardhul hasan). Kami tidak mengenakan bunga atau biaya tambahan apapun. Anda hanya perlu mengembalikan jumlah yang Anda pinjam."/>
                    </div>

                </div>

            </div>
        </section>
    );
}