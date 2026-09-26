import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { WhatWeDo } from "@/components/home/WhatWeDo";
import { WhatWeChange } from "@/components/home/WhatWeChange";
import { TeamSection } from "@/components/home/TeamSection";
import { UniversitySection } from "@/components/home/UniversitySection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper">
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
