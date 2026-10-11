import type { Metadata } from "next";
import LandingNavbar from "./components/LandingNavbar";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import PricingSection from "./components/PricingSection";
import CodeSection from "./components/CodeSection";
import LandingFaq from "./components/LandingFaq";
import LandingFooter from "./components/LandingFooter";

export const metadata: Metadata = {
  title: "KiosAI — Gateway API & Pasar Token AI Indonesia",
  description:
    "Akses model AI kelas dunia (Claude, GPT, Gemini, DeepSeek) dengan pembayaran instan via QRIS Rupiah. Kompatibel 100% dengan OpenAI SDK.",
};

export default function LandingPage() {
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
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <CodeSection />
        <LandingFaq />
      </main>
      <LandingFooter />
    </div>
  );
}
