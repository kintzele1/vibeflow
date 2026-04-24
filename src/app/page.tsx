import { Nav } from "@/components/nav/Nav";
import { Hero } from "@/components/hero/Hero";
import { MarketingOS } from "@/components/sections/MarketingOS";
import { Features } from "@/components/sections/Features";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Pricing } from "@/components/sections/Pricing";
import { FAQ } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/footer/Footer";
import { GoogleAnalytics } from "@/components/providers/GoogleAnalytics";

// Testimonials removed pre-launch (placeholder quotes from non-real users).
// Bring back once 3+ real friendlies give usable, attributable quotes.
// Leaving Testimonials.tsx file in place for easy revive — just re-import and re-add <Testimonials /> below.

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <MarketingOS />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
      <GoogleAnalytics />
    </>
  );
}
