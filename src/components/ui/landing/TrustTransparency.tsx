import type { LandingSection } from "@/schemas/cms.schema";
import { CmsIcon } from "@/components/cms/cms-icon";
type Data = Extract<LandingSection, { type: "trustTransparency" }>;

export const TrustTransparency = ({ data }: { data: Data }) => (
  <section id={data.id} className="bg-[#F3F4F6] py-16 md:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-14 text-center">
        <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">{data.title}</h2>
        <div className="mx-auto mb-4 h-1 w-24 rounded-full bg-[#07B0C8]" />
        <p className="mx-auto max-w-2xl text-sm text-gray-500 md:text-[15px]">{data.description}</p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.features.map((feature) => (
          <article key={feature.id} className="rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-cyan-200 hover:shadow-lg">
            <div className="mb-4 inline-flex rounded-full bg-[#07B0C8]/12 p-2 text-[#07B0C8]"><CmsIcon name={feature.icon} /></div>
            <h3 className="mb-2.5 text-[16px] font-bold text-gray-900">{feature.title}</h3>
            <p className="text-[13px] leading-relaxed text-gray-600">{feature.description}</p>
          </article>
        ))}
      </div>
      {data.certifications.length > 0 && (
        <div className="mt-10 flex flex-wrap justify-center gap-3 border-t border-gray-200 pt-8">
          {data.certifications.map((item) => <span key={item.id} className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-[12px] font-medium text-gray-500">{item.label}</span>)}
        </div>
      )}
    </div>
  </section>
);
