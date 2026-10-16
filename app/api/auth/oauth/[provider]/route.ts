import { NextRequest, NextResponse } from "next/server";
import { getOAuthRedirectUrl } from "@/lib/oauth";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (provider !== "github" && provider !== "google") {
    return NextResponse.json({ error: "Provider tidak didukung" }, { status: 400 });
  }

  const clientId = provider === "github" ? process.env.GITHUB_CLIENT_ID : process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({
      error: `OAuth ${provider} belum dikonfigurasi. Tambahkan ${provider === "github" ? "GITHUB_CLIENT_ID" : "GOOGLE_CLIENT_ID"} di file .env.`,
    }, { status: 503 });
  }

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "kiosai.dhanisepeda.workers.dev";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const redirectUri = `${proto}://${host}/api/auth/oauth/${provider}/callback`;

  const authUrl = getOAuthRedirectUrl(provider, redirectUri);
  return NextResponse.redirect(authUrl);
}
