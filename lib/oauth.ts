import crypto from "crypto";
import { db } from "./db";
import { UserRecord } from "./keys";

export interface OAuthProfile {
  provider: "github" | "google";
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export function getOAuthRedirectUrl(provider: "github" | "google", redirectUri: string, state: string = ""): string {
  if (provider === "github") {
    const clientId = process.env.GITHUB_CLIENT_ID || "";
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "read:user user:email",
      state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForProfile(
  provider: "github" | "google",
  code: string,
  redirectUri: string
): Promise<OAuthProfile> {
  if (provider === "github") {
    const clientId = process.env.GITHUB_CLIENT_ID || "";
    const clientSecret = process.env.GITHUB_CLIENT_SECRET || "";
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error(tokenData.error_description || "Gagal autentikasi GitHub");

    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, "User-Agent": "KiosAI-App" },
    });
    const ghUser = await userRes.json();

    let email = ghUser.email;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, "User-Agent": "KiosAI-App" },
      });
      const emails = await emailsRes.json();
      const primary = emails.find((e: any) => e.primary && e.verified) || emails[0];
      email = primary?.email;
    }
    if (!email) throw new Error("Email GitHub tidak ditemukan");

    return {
      provider: "github",
      id: String(ghUser.id),
      email: email.toLowerCase().trim(),
      name: ghUser.name || ghUser.login || "GitHub Developer",
      avatarUrl: ghUser.avatar_url,
    };
  }

  // Google OAuth
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error(tokenData.error_description || "Gagal autentikasi Google");

  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const gUser = await userInfoRes.json();
  if (!gUser.email) throw new Error("Email Google tidak ditemukan");

  return {
    provider: "google",
    id: String(gUser.id),
    email: gUser.email.toLowerCase().trim(),
    name: gUser.name || "Google User",
    avatarUrl: gUser.picture,
  };
}

export async function upsertOAuthUser(profile: OAuthProfile): Promise<UserRecord> {
  const existing = await db.queryOne<UserRecord>(
    `SELECT id, email, username, full_name, tier, balance_tokens, locked_bonus_tokens, is_pro_unlocked, alert_webhook_url, alert_threshold_tokens 
     FROM kiosai.users WHERE (oauth_provider = ? AND oauth_id = ?) OR email = ? LIMIT 1`,
    [profile.provider, profile.id, profile.email]
  );

  if (existing) {
    await db.execute(
      `UPDATE kiosai.users SET oauth_provider = ?, oauth_id = ?, avatar_url = ? WHERE id = ?`,
      [profile.provider, profile.id, profile.avatarUrl || null, existing.id]
    ).catch(() => {});
    return existing;
  }

  const userId = `usr_${crypto.randomUUID()}`;
  const initialTokens = 250000;
  const lockedBonusTokens = 2250000;

  await db.execute(
    `INSERT INTO kiosai.users (id, email, full_name, tier, balance_tokens, locked_bonus_tokens, is_pro_unlocked, oauth_provider, oauth_id, avatar_url)
     VALUES (?, ?, ?, 'free', ?, ?, 0, ?, ?, ?)`,
    [userId, profile.email, profile.name, initialTokens, lockedBonusTokens, profile.provider, profile.id, profile.avatarUrl || null]
  );

  await db.execute(
    `INSERT INTO kiosai.orders (id, user_id, amount_idr, tokens_purchased, package_tier, payment_method, status, paid_at)
     VALUES (?, ?, 0, ?, 'free', 'bonus', 'paid', NOW())`,
    [crypto.randomUUID(), userId, initialTokens]
  ).catch(() => {});

  return {
    id: userId,
    email: profile.email,
    full_name: profile.name,
    tier: "free",
    balance_tokens: initialTokens,
    locked_bonus_tokens: lockedBonusTokens,
    is_pro_unlocked: 0,
  };
}
