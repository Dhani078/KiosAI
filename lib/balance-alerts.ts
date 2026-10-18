export interface WebhookAlertPayload {
  event: "kiosai.balance.low";
  userId: string;
  email: string;
  currentBalance: number;
  threshold: number;
  timestamp: string;
  actionUrl: string;
}

// In-memory debounce untuk mencegah spam webhook pada tiap request (maks 1x per 30 menit per user)
const recentAlerts = new Map<string, number>();
const ALERT_COOLDOWN_MS = 30 * 60 * 1000;

export async function sendLowBalanceWebhook(params: {
  userId: string;
  email: string;
  webhookUrl: string;
  balance: number;
  threshold: number;
}): Promise<boolean> {
  const { userId, email, webhookUrl, balance, threshold } = params;
  if (!webhookUrl || !webhookUrl.startsWith("http")) return false;

  // SSRF guard: blokir target localhost dan rentang IP privat/internal
  if (/^(http|https):\/\/(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.)/i.test(webhookUrl)) {
    return false;
  }

  const now = Date.now();
  const lastSent = recentAlerts.get(userId) || 0;
  if (now - lastSent < ALERT_COOLDOWN_MS) {
    return false;
  }

  recentAlerts.set(userId, now);

  const payload: WebhookAlertPayload = {
    event: "kiosai.balance.low",
    userId,
    email,
    currentBalance: balance,
    threshold,
    timestamp: new Date().toISOString(),
    actionUrl: "https://tokoai.my.id/dashboard",
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "TokoAI-Alert-Webhook/1.0",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
