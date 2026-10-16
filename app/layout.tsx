import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KiosAI - AI Token Gateway & Marketplace",
  description: "Beli token AI via QRIS, dapatkan API key OpenAI-compatible untuk Claude, GPT, dan Gemini.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/kiosai-logo-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/brand/kiosai-logo-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
