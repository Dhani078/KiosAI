import { db } from "./db";
import crypto from "crypto";
import { validatePlaygroundToken } from "./session-key";

export interface ApiKeyRecord {
  id: string;
  user_id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  rate_limit_per_min: number;
  allowed_models: string | null;
  max_spend_tokens?: number;
  spent_tokens?: number;
  is_active: number | boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface UserRecord {
  id: string;
  email: string;
  username?: string | null;
  full_name: string;
  tier: "free" | "pro" | string;
  balance_tokens: number;
  locked_bonus_tokens?: number;
  is_pro_unlocked?: number;
  alert_webhook_url?: string | null;
  alert_threshold_tokens?: number;
}

export function getRequiredTierForModel(modelId: string): "free" | "pro" {
  const m = modelId.toLowerCase();
  if (m.includes("atria")) {
    return "free";
  }
  return "pro";
}

export function isModelAllowedForTier(tier: string, model: string): boolean {
  const t = (tier || "free").toLowerCase();
  if (t === "free") {
    const m = model.toLowerCase();
    return m.includes("atria");
  }
  return true;
}

export function hashKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

export async function createApiKey(params: {
  userId: string;
  name?: string;
  allowedModels?: string[] | null;
  rateLimit?: number;
  maxSpendTokens?: number;
}): Promise<{ rawKey: string; keyRecord: ApiKeyRecord }> {
  const { userId, name = "KiosAI Key", allowedModels = null, rateLimit = 60, maxSpendTokens = 0 } = params;
  
  const rawSecret = crypto.randomBytes(16).toString("hex");
  const rawKey = `kios-${rawSecret}`;
  const keyHash = hashKey(rawKey);
  const keyPrefix = rawKey.substring(0, 11); // e.g. "kios-1a2b3c"
  const keyId = crypto.randomUUID();

  const modelsJson = allowedModels ? JSON.stringify(allowedModels) : null;

  await db.execute(
    `INSERT INTO kiosai.api_keys (id, user_id, key_hash, key_prefix, name, rate_limit_per_min, allowed_models, max_spend_tokens, spent_tokens)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [keyId, userId, keyHash, keyPrefix, name, rateLimit, modelsJson, maxSpendTokens]
  );

  const keyRecord = await db.queryOne<ApiKeyRecord>(
    `SELECT * FROM kiosai.api_keys WHERE id = ?`,
    [keyId]
  );

  return { rawKey, keyRecord: keyRecord! };
}

export async function validateApiKey(rawKey: string): Promise<{
  valid: boolean;
  user?: UserRecord;
  key?: ApiKeyRecord;
  error?: string;
}> {
  if (!rawKey.startsWith("kios-")) {
    return { valid: false, error: "Invalid API key format. Expected 'kios-...'" };
  }

  const pgAuth = await validatePlaygroundToken(rawKey);
  if (pgAuth) return pgAuth;

  const keyHash = hashKey(rawKey);
  const key = await db.queryOne<ApiKeyRecord>(
    `SELECT * FROM kiosai.api_keys WHERE key_hash = ?`,
    [keyHash]
  );

  if (!key) {
    return { valid: false, error: "API key not found or revoked" };
  }

  if (!key.is_active) {
    return { valid: false, error: "API key is deactivated" };
  }

  const user = await db.queryOne<UserRecord>(
    `SELECT * FROM kiosai.users WHERE id = ?`,
    [key.user_id]
  );

  if (!user) {
    return { valid: false, error: "User account not found" };
  }

  if (Number(user.balance_tokens) <= 0) {
    return { valid: false, error: "Token balance exhausted. Please top up." };
  }

  // Check key spend cap
  if (key.max_spend_tokens && Number(key.max_spend_tokens) > 0) {
    if (Number(key.spent_tokens || 0) >= Number(key.max_spend_tokens)) {
      return { valid: false, error: `Key spend limit reached (${Number(key.max_spend_tokens).toLocaleString("id-ID")} tokens).` };
    }
  }

  // Update last_used_at in background
  db.execute(`UPDATE kiosai.api_keys SET last_used_at = NOW() WHERE id = ?`, [key.id]).catch(() => {});

  return { valid: true, user, key };
}

export async function deductTokens(
  userId: string,
  tokens: number,
  multiplier: number = 1.0,
  keyId?: string
): Promise<number> {
  const safeTokens = Math.max(1, Math.round(tokens * multiplier));
  await db.execute(
    `UPDATE kiosai.users SET balance_tokens = GREATEST(0, balance_tokens - ?) WHERE id = ?`,
    [safeTokens, userId]
  );
  if (keyId) {
    db.execute(
      `UPDATE kiosai.api_keys SET spent_tokens = spent_tokens + ? WHERE id = ?`,
      [safeTokens, keyId]
    ).catch(() => {});
  }
  return safeTokens;
}

export async function logUsage(params: {
  apiKeyId: string;
  userId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  statusCode: number;
}) {
  const total = params.promptTokens + params.completionTokens;
  await db.execute(
    `INSERT INTO kiosai.usage_logs (api_key_id, user_id, model, prompt_tokens, completion_tokens, total_tokens, latency_ms, status_code)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.apiKeyId,
      params.userId,
      params.model,
      params.promptTokens,
      params.completionTokens,
      total,
      params.latencyMs,
      params.statusCode,
    ]
  );
}
