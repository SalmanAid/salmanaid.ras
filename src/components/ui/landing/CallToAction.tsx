import Link from "next/link";
import type { LandingSection } from "@/schemas/cms.schema";
import { CmsIcon } from "@/components/cms/cms-icon";
import { RichTextRenderer } from "@/components/cms/rich-text";
type Data = Extract<LandingSection, { type: "callToAction" }>;
const backgrounds = {
  cyan: "from-[#07B0C8] to-[#0698AD]",
  navy: "from-slate-900 to-slate-700",
  green: "from-emerald-700 to-emerald-600",
};

export const CallToAction = ({ data }: { data: Data }) => (
  <section id={data.id} className="bg-[#F3F4F6] py-16 md:py-20">
    <div className="mx-auto max-w-8xl px-3 sm:px-5 lg:px-8">
      <div className={`relative overflow-hidden rounded-2xl bg-linear-to-r px-8 py-14 text-center text-white shadow-lg md:px-14 md:py-16 ${backgrounds[data.background]}`}>
        <div className="pointer-events-none absolute -bottom-14 -left-10 h-44 w-44 rounded-full bg-white/8" />
        <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/8" />
        <h2 className="mb-4 text-3xl font-bold md:text-[52px]">{data.title}</h2>
        <RichTextRenderer value={data.description} className="mx-auto mb-9 max-w-4xl text-sm leading-relaxed text-cyan-50 md:text-[15px]" />
        <div className="relative z-10 flex flex-col justify-center gap-4 sm:flex-row">
          {data.buttons.map((button, index) => (
            <Link key={button.id} href={button.href} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-7 py-3 font-semibold transition-all focus-visible:ring-2 focus-visible:ring-white ${index === 0 ? "bg-[#FCB82E] text-[#111827] hover:bg-[#E8A91F]" : "border border-white text-white hover:bg-white hover:text-[#07B0C8]"}`}>
              {button.icon && <CmsIcon name={button.icon} className="h-4 w-4" />}
              {button.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  </section>
);
