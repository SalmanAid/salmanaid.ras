"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { LandingSection } from "@/schemas/cms.schema";
import { RichTextRenderer } from "@/components/cms/rich-text";

type Data = Extract<LandingSection, { type: "faq" }>;

export default function FAQComponent({ data }: { data: Data }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <section id={data.id} className="scroll-mt-16 bg-[#F3F4F6] py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:px-8">
        <div className="text-center lg:text-left">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">{data.title}</h2>
          <p className="mx-auto max-w-2xl text-sm text-gray-500 md:text-[15px] lg:mx-0">{data.description}</p>
        </div>
        <div className="flex w-full flex-col gap-4">
          {data.items.map((item) => {
            const isOpen = openId === item.id;
            return (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-${item.id}`}
                    className="flex min-h-14 w-full items-center justify-between gap-4 bg-slate-50 px-6 py-4 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#07B0C8]"
                  >
                    <span>{item.question}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                </h3>
                <div id={`faq-${item.id}`} hidden={!isOpen} className="border-t border-slate-100 p-6">
                  <RichTextRenderer value={item.answer} className="text-sm leading-relaxed text-slate-600" />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
