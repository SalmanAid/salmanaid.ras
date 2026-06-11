import type { LandingSection } from "@/schemas/cms.schema";
type Data = Extract<LandingSection, { type: "howItWorks" }>;
const colors = { gold: "bg-amber-500", cyan: "bg-cyan-500", teal: "bg-teal-600", green: "bg-emerald-600" };

export const HowItWorks = ({ data }: { data: Data }) => (
  <section id={data.id} className="bg-[#F3F4F6] py-18 md:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-14 text-center">
        <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">{data.title}</h2>
        <div className="mx-auto mb-4 h-1 w-24 rounded-full bg-[#07B0C8]" />
        <p className="mx-auto max-w-2xl text-sm text-gray-500 md:text-[15px]">{data.description}</p>
      </div>
      <div className={`grid grid-cols-1 gap-8 ${data.steps.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {data.steps.map((step, index) => (
          <div key={step.id} className="relative">
            <div className="h-full rounded-xl border border-gray-100 bg-white p-7 transition-shadow hover:shadow-md">
              <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white ${colors[step.color]}`}>{index + 1}</div>
              <h3 className="mb-3 text-[20px] font-bold leading-none text-gray-900">{step.title}</h3>
              <p className="text-[13.5px] leading-relaxed text-gray-600">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
