import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Hero } from "@/components/home/Hero";
import { Numbers, NumbersSkeleton } from "@/components/home/Numbers";
import { Problem } from "@/components/home/Problem";
import { Solution } from "@/components/home/Solution";
import { ProductTour } from "@/components/home/ProductTour";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeaturedSchools, FeaturedSchoolsSkeleton } from "@/components/home/FeaturedSchools";
import { TeamSection } from "@/components/home/TeamSection";
import { Trust } from "@/components/home/Trust";
import { Faq } from "@/components/home/Faq";
import { FinalCta } from "@/components/home/FinalCta";
import { PAGE_SEO, siteJsonLd } from "@/lib/seo";
import { jsonLdHtml, pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(PAGE_SEO.home);

/**
 * The homepage tells the story in order: the hook, proof, the problem, our
 * fix, the product, how it works, the schools, who we are, trust, FAQ, CTA.
 * Sections that wait on data stream in behind same-sized placeholders.
 */
export default function HomePage() {
  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(siteJsonLd()) }}
      />
      <Hero />
      <Suspense fallback={<NumbersSkeleton />}>
        <Numbers />
      </Suspense>
      <Problem />
      <Solution />
      <Suspense fallback={<div className="min-h-[1600px]" />}>
        <ProductTour />
      </Suspense>
      <HowItWorks />
      <Suspense fallback={<FeaturedSchoolsSkeleton />}>
        <FeaturedSchools />
      </Suspense>
      <TeamSection />
      <Trust />
      <Faq />
      <div className="pt-16 md:pt-24">
        <FinalCta />
      </div>
    </PageShell>
  );
}
