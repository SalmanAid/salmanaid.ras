"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { LandingSection } from "@/schemas/cms.schema";
import { CmsIcon } from "@/components/cms/cms-icon";
import { RichTextRenderer } from "@/components/cms/rich-text";

type Data = Extract<LandingSection, { type: "programs" }>;

export default function ProgramComponent({ data }: { data: Data }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = data.programs.find((program) => program.id === selectedId);

  useEffect(() => {
    if (!selected) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setSelectedId(null);
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = "";
    };
  }, [selected]);

  return (
    <section id={data.id} className="relative scroll-mt-16 bg-[#F3F4F6] py-16 md:py-24">
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" onMouseDown={() => setSelectedId(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="program-dialog-title"
            className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-100 bg-white p-6 text-slate-800 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button type="button" onClick={() => setSelectedId(null)} aria-label="Tutup detail program" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#07B0C8]">
              <X className="h-5 w-5" />
            </button>
            <h2 id="program-dialog-title" className="pr-12 text-xl font-bold text-[#C87900]">Detail Program: {selected.title}</h2>
            <RichTextRenderer value={selected.detail} className="mt-4 text-sm leading-relaxed text-slate-600" />
            {selected.terms.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <h3 className="mb-3 text-sm font-bold text-slate-700">Syarat dan Ketentuan</h3>
                <ul className="space-y-2.5">
                  {selected.terms.map((term, index) => (
                    <li key={`${selected.id}-${index}`} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CmsIcon name="check" className="h-3 w-3" /></span>
                      <span>{term}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Link href={selected.href} className="mt-6 flex min-h-11 w-full items-center justify-center rounded-xl bg-[#FCB82E] px-4 text-sm font-bold text-white transition hover:bg-[#E7A722] focus-visible:ring-2 focus-visible:ring-[#C87900]">
              {selected.buttonLabel}
            </Link>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">{data.title}</h2>
          <div className="mx-auto mb-4 h-1 w-24 rounded-full bg-[#FCB82E]" />
          <p className="mx-auto max-w-2xl text-sm text-gray-500 md:text-[15px]">{data.description}</p>
        </div>
        <div className={`mx-auto grid max-w-5xl grid-cols-1 gap-6 ${data.programs.length >= 2 ? "md:grid-cols-2" : ""}`}>
          {data.programs.map((program) => (
            <article key={program.id} className="flex flex-col rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-4 w-fit rounded-2xl bg-[#FFF5DF] p-3 text-[#C87900]"><CmsIcon name={program.icon} className="h-6 w-6" /></div>
              <h3 className="mb-2 text-xl font-bold text-slate-800">{program.title}</h3>
              <p className="mb-4 flex-1 text-sm font-light leading-relaxed text-slate-500">{program.summary}</p>
              <button type="button" onClick={() => setSelectedId(program.id)} className="min-h-11 w-fit rounded-lg px-1 text-left text-sm font-bold text-[#C87900] hover:underline focus-visible:ring-2 focus-visible:ring-[#FCB82E]">
                Pelajari Selengkapnya →
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
