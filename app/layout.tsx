import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KiosAI - AI Token Gateway & Marketplace",
  description: "Beli token AI via QRIS, dapatkan API key OpenAI-compatible untuk Claude, GPT, dan Gemini.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased bg-[#090d16] text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
