/**
 * @file page.tsx — / — LedgerIQ public landing page.
 * @module app
 *
 * Thin RSC orchestrator that composes all landing sections in order.
 * All client interactivity (nav auto-hide, demo scroll-spy, theme toggle)
 * is isolated inside the individual components — this file stays a Server Component.
 *
 * @related components/landing/
 */

import {
  CtaBanner,
  DemoSection,
  FeaturesSection,
  HeroSection,
  LandingFooter,
  LandingNav,
  TechSection,
} from "@/components/landing";

export default function HomePage() {
  return (
    <>
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <DemoSection />
        <TechSection />
        <CtaBanner />
      </main>
      <LandingFooter />
    </>
  );
}
