import type { PublicLandingContent } from "@/schemas/cms.schema";
import type { LandingMetrics } from "@/services/landing-metrics.service";
import { Navbar } from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Hero } from "@/components/ui/landing/Hero";
import { HowItWorks } from "@/components/ui/landing/HowItWorks";
import { ImpactStats } from "@/components/ui/landing/ImpactStats";
import ProgramComponent from "@/components/ui/landing/Program";
import { TrustTransparency } from "@/components/ui/landing/TrustTransparency";
import FAQComponent from "@/components/ui/landing/FAQ";
import { CallToAction } from "@/components/ui/landing/CallToAction";

export function LandingPageRenderer({
  content,
  metrics,
}: {
  content: PublicLandingContent;
  metrics: LandingMetrics;
}) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar config={content.navbar} />
      <main>
        {content.sections.filter((section) => section.enabled).map((section) => {
          if (section.type === "hero") return <Hero key={section.id} data={section} />;
          if (section.type === "howItWorks") return <HowItWorks key={section.id} data={section} />;
          if (section.type === "impactStats") return <ImpactStats key={section.id} data={section} metrics={metrics} />;
          if (section.type === "programs") return <ProgramComponent key={section.id} data={section} />;
          if (section.type === "trustTransparency") return <TrustTransparency key={section.id} data={section} />;
          if (section.type === "faq") return <FAQComponent key={section.id} data={section} />;
          return <CallToAction key={section.id} data={section} />;
        })}
      </main>
      <Footer config={content.footer} />
    </div>
  );
}
