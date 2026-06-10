import type { Metadata } from "next";
import { LandingPageRenderer } from "@/components/cms/landing-page-renderer";
import { getPublishedLanding } from "@/services/cms.service";
import { getLandingMetrics } from "@/services/landing-metrics.service";

export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPublishedLanding();
  return {
    title: content.seo.title,
    description: content.seo.description,
    openGraph: {
      title: content.seo.title,
      description: content.seo.description,
      images: [content.seo.ogImageUrl],
    },
  };
}

export default async function Home() {
  const [content, metrics] = await Promise.all([getPublishedLanding(), getLandingMetrics()]);
  return <LandingPageRenderer content={content} metrics={metrics} />;
}
