import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { WhatWeDo } from "@/components/home/WhatWeDo";
import { WhatWeChange } from "@/components/home/WhatWeChange";
import { TeamSection } from "@/components/home/TeamSection";
import { UniversitySection } from "@/components/home/UniversitySection";
import { PAGE_SEO, siteJsonLd } from "@/lib/seo";
import { jsonLdHtml, pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(PAGE_SEO.home);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(siteJsonLd()) }}
      />
      <Navbar />
      <main>
        <Hero />
        <UniversitySection />
        <WhatWeDo />
        <WhatWeChange />
        <TeamSection />
      </main>
      <Footer />
    </div>
  );
}
