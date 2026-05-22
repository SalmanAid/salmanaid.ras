
"use client"

import Image from "next/image";
import HeartGoldIcon from "../../../../public/heart-gold.svg"
import GraduationHatGoldIcon from "../../../../public/graduation-hat-gold.svg"

import ProgramDetailComponent from "./ProgramDetail";
import { useState } from "react";

export default function ProgramComponent () {

    const [isOpen, setIsOpen] = useState<boolean>(false)

    return (
       <section className="py-12 md:py-20 bg-[#F3F4F6]">

            {/* the pop up container for program detail */}
            {isOpen && <ProgramDetailComponent />}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Section Header */}
                <div className="text-center mb-14">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Program Kami
                    </h2>
                    <div className="mx-auto mb-4 h-1 w-24 rounded-full bg-[#FCB82E]" />
                    <p className="text-gray-500 text-sm md:text-[15px] max-w-2xl mx-auto">
                       Berbagai program bantuan yang dirancang khusus untuk mendukung perjalanan pendidikan Anda
                    </p>
                </div>

                {/* main content container */}
                <div className="flex justify-center items-center w-full h-full gap-2">

                    {/* bantuan dana pendidikan */}
                    <div className="flex flex-col w-[50%] h-full p-8 justify-start items-center bg-white rounded-2xl">

                        {/* image */}
                        <div className="p-2 rounded-2xl bg-[#FFF5DF] flex justify-start items-center w-fit py-2">
                            <Image
                                src = {GraduationHatGoldIcon}
                                alt="Bantuan dana Pendidikan Icon"
                            />
                        </div>

                        {/* title */}
                        <div className="w-full text-start justify-start items-center h-fit flex font-bold text-xl py-2">
                            Bantuan Dana Pendidikan
                        </div>

                        {/* caption */}
                        <div className="w-full text-start justify-start items-center h-fit flex font-light text-xs py-2">
                            Pinjaman bebas riba untuk biaya kuliah, buku, dan kebutuhan akademik lainnya dengan tenor fleksibel.
                        </div>

                        {/* cta */}
                        <div className="w-full text-start justify-start items-center h-fit flex font-bold text-[#FCB82E] py-2 text-sm " onClick={() => setIsOpen(!isOpen)}>
                            Pelajari Selengkapnya -&gt;
                        </div>

                    </div>

                    {/* donasi kilat transparecny */}
                    <div className="flex flex-col w-[50%] h-full p-8 justify-start items-center bg-white rounded-2xl">

                        {/* image */}
                        <div className="p-2 rounded-2xl bg-[#FFF5DF] flex justify-start items-center w-fit py-2">
                            <Image
                                src = {HeartGoldIcon}
                                alt="Donasi Kilat Icon"
                            />
                        </div>

                        {/* title */}
                        <div className="w-full text-start justify-start items-center h-fit flex font-bold text-xl py-2">
                            Donasi Kilat Emergency
                        </div>

                        {/* caption */}
                        <div className="w-full text-start justify-start items-center h-fit flex font-light text-xs py-2">
                            Bantuan cepat untuk mahasiswa yang menghadapi situasi darurat finansial dengan proses persetujuan 24 jam.
                        </div>

                        {/* cta */}
                        <div className="w-full text-start justify-start items-center h-fit flex font-bold text-[#FCB82E] py-2 text-sm " onClick={() => setIsOpen(!isOpen)}>
                            Pelajari Selengkapnya -&gt;
                        </div>

                    </div>

                </div>


            </div>
        </section>
    );
}