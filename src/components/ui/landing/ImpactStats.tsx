import type { LandingSection } from "@/schemas/cms.schema";
import type { LandingMetrics } from "@/services/landing-metrics.service";
import { CmsIcon } from "@/components/cms/cms-icon";

type Data = Extract<LandingSection, { type: "impactStats" }>;

function formatMetric(card: Data["cards"][number], metrics: LandingMetrics) {
  if (card.metric === "manual") return `${card.prefix}${card.manualValue || "0"}${card.suffix}`;
  const value = metrics[card.metric];
  const formatted = card.format === "compact"
    ? new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(value)
    : card.format === "full"
      ? new Intl.NumberFormat("id-ID").format(value)
      : String(value);
  return `${card.prefix}${formatted}${card.suffix}`;
}

export const ImpactStats = ({ data, metrics }: { data: Data; metrics: LandingMetrics }) => (
  <section id={data.id} className="bg-[#07B0C8] py-16 text-white md:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-14 text-center">
        <h2 className="mb-4 text-3xl font-bold md:text-4xl">{data.title}</h2>
        <div className="mx-auto mb-4 h-1 w-24 rounded-full bg-[#FCB82E]" />
        <p className="mx-auto max-w-2xl text-sm text-cyan-100 md:text-[15px]">{data.description}</p>
      </div>
      <div className={`grid grid-cols-1 gap-8 ${data.cards.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {data.cards.map((card) => (
          <article key={card.id} className="rounded-xl border border-white/20 bg-white/12 p-10 text-center transition-all hover:bg-white/15">
            <div className="mb-6 flex justify-center"><CmsIcon name={card.icon} className="h-8 w-8" /></div>
            <h3 className="mb-2 text-3xl font-bold text-white md:text-5xl">{formatMetric(card, metrics)}</h3>
            <p className="mb-3 text-lg font-semibold text-white">{card.label}</p>
            <p className="text-sm text-cyan-100">{card.description}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);
