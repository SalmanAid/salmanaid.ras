import Image from "next/image";
import Link from "next/link";
import type { LandingSection } from "@/schemas/cms.schema";
import { CmsIcon } from "@/components/cms/cms-icon";
import { RichTextRenderer } from "@/components/cms/rich-text";

type HeroData = Extract<LandingSection, { type: "hero" }>;
const themeClass = {
  gold: "bg-[#FCB82E] hover:bg-[#e7a722]",
  cyan: "bg-[#07B0C8] hover:bg-[#0698ac]",
  green: "bg-emerald-600 hover:bg-emerald-700",
};
const iconClass = {
  gold: "bg-[#FCB82E]/15 text-[#C87900]",
  cyan: "bg-[#07B0C8]/15 text-[#07B0C8]",
  green: "bg-emerald-100 text-emerald-700",
};
const overlayClass = {
  cyan: "bg-linear-to-r from-[#07B0C8]/72 via-[#07B0C8]/52 to-[#07B0C8]/30",
  dark: "bg-linear-to-r from-slate-950/80 via-slate-900/55 to-slate-900/20",
  soft: "bg-linear-to-r from-cyan-700/55 via-cyan-600/35 to-transparent",
};

export const Hero = ({ data }: { data: HeroData }) => (
  <section id={data.id} className="relative w-full bg-[#F3F4F6] pb-28 md:pb-20">
    <div className="relative h-[58vh] min-h-105 w-full overflow-hidden">
      <Image
        src={data.image.url}
        alt={data.image.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: `${data.image.focalX}% ${data.image.focalY}%` }}
      />
      <div className={`absolute inset-0 ${overlayClass[data.overlay]}`} />
      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-6 md:px-8">
        <div className="max-w-2xl text-white">
          <h1 className="text-[2.35rem] font-extrabold leading-[1.05] tracking-tight md:text-[3.45rem]">{data.heading}</h1>
          <RichTextRenderer value={data.description} className="mt-5 max-w-[52ch] text-[13.5px] leading-relaxed text-white/85 md:text-[16px]" />
        </div>
      </div>
    </div>
    <div className="relative z-20 mx-auto -mt-14 max-w-6xl px-4">
      <div className={`grid grid-cols-1 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_14px_30px_-18px_rgba(0,0,0,0.45)] ${data.cards.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {data.cards.map((card, index) => (
          <article key={card.id} className={`p-6 md:p-7 ${index < data.cards.length - 1 ? "border-b border-gray-100 md:border-b-0 md:border-r" : ""}`}>
            <div className="flex items-start gap-4">
              <div className={`rounded-full p-2.5 ${iconClass[card.theme]}`}><CmsIcon name={card.icon} /></div>
              <div>
                <h2 className="text-[24px] font-bold leading-none text-[#1F2937]">{card.title}</h2>
                <p className="mt-4 max-w-[48ch] text-[13.5px] leading-relaxed text-gray-600">{card.description}</p>
                <Link href={card.button.href} className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition-colors ${themeClass[card.theme]}`}>
                  {card.button.label}
                  {card.button.icon && <CmsIcon name={card.button.icon} className="h-4 w-4" />}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);
