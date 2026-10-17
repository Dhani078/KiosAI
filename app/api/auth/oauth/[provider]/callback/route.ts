import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForProfile, upsertOAuthUser } from "@/lib/oauth";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (provider !== "github" && provider !== "google") {
    return NextResponse.json({ error: "Provider tidak didukung" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    const errorDesc = searchParams.get("error_description") || error || "Autentikasi dibatalkan";
    return new NextResponse(
      `<!DOCTYPE html><html><body><script>alert(${JSON.stringify(errorDesc)}); window.location.href = "/";</script></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
    );
  }

  try {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "kiosai.dhanisepeda.workers.dev";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const redirectUri = `${proto}://${host}/api/auth/oauth/${provider}/callback`;

    const profile = await exchangeCodeForProfile(provider, code, redirectUri);
    const user = await upsertOAuthUser(profile);

    const isAdmin = Boolean(user.username === "adminfordhani" || user.email === "adminfordhani@kiosai.id");

    const html = `<!DOCTYPE html>
<html>
<head><title>Menghubungkan ke TokoAI...</title></head>
<body style="background:#0b0d10;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <p>Berhasil masuk! Mengalihkan ke Dashboard...</p>
  <script>
    try {
      localStorage.setItem("kiosai_user_id", ${JSON.stringify(user.id)});
      localStorage.setItem("kiosai_is_admin", "${isAdmin ? "1" : "0"}");
    } catch (e) {}
    window.location.href = "/dashboard";
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 200,
    });
  } catch (err: any) {
    const htmlErr = `<!DOCTYPE html>
<html>
<head><title>Gagal Masuk</title></head>
<body style="background:#0b0d10;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;">
    <p style="color:#ef4444;">Autentikasi Gagal: ${err.message}</p>
    <a href="/" style="color:#f28c38;text-decoration:none;">&larr; Kembali ke Beranda</a>
  </div>
</body>
</html>`;
    return new NextResponse(htmlErr, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 500,
    });
  }
}
