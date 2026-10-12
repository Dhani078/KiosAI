import type { Metadata } from "next";
import { Suspense } from "react";
import LandingNavbar from "./landing/components/LandingNavbar";
import HeroSection from "./landing/components/HeroSection";
import FeaturesSection from "./landing/components/FeaturesSection";
import ModelsSection from "./landing/components/ModelsSection";
import PricingSection from "./landing/components/PricingSection";
import CodeSection from "./landing/components/CodeSection";
import LandingFaq from "./landing/components/LandingFaq";
import LandingFooter from "./landing/components/LandingFooter";
import LandingAuthWatcher from "./landing/components/LandingAuthWatcher";

export const metadata: Metadata = {
  title: "KiosAI — Gateway API & Pasar Token AI Indonesia",
  description:
    "Akses model AI kelas dunia (Claude, GPT, Gemini, DeepSeek) dengan pembayaran instan via QRIS Rupiah. Kompatibel 100% dengan OpenAI SDK.",
};

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--canvas)",
        color: "var(--text)",
        overflowX: "hidden",
      }}
    >
      <LandingNavbar />
      <Suspense fallback={null}>
        <LandingAuthWatcher />
      </Suspense>
      <main id="main-content">
        <HeroSection />
        <FeaturesSection />
        <ModelsSection />
        <PricingSection />
        <CodeSection />
        <LandingFaq />
      </main>
      <LandingFooter />
    </div>
  );
}