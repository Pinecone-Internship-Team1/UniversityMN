import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/home/Hero";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main>
        <Hero />
      </main>
    </div>
  );
}
