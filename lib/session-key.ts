import crypto from "crypto";
import { db } from "./db";
import { UserRecord, ApiKeyRecord } from "./keys";

export function createPlaygroundToken(userId: string): string {
  const secret = process.env.DATABASE_URL || "kiosai_internal_secret";
  const sig = crypto.createHmac("sha256", secret).update(`playground:${userId}`).digest("hex").slice(0, 32);
  return `kios-pg-${userId}.${sig}`;
}

export async function validatePlaygroundToken(rawKey: string): Promise<{
  valid: boolean;
  user?: UserRecord;
  key?: ApiKeyRecord;
  error?: string;
} | null> {
  if (!rawKey.startsWith("kios-pg-")) return null;

  const rest = rawKey.slice(8);
  const dotIdx = rest.indexOf(".");
  if (dotIdx === -1) return { valid: false, error: "Invalid playground key format" };

  const userId = rest.slice(0, dotIdx);
  const sig = rest.slice(dotIdx + 1);
  const secret = process.env.DATABASE_URL || "kiosai_internal_secret";
  const expectedSig = crypto.createHmac("sha256", secret).update(`playground:${userId}`).digest("hex").slice(0, 32);

  if (sig !== expectedSig) {
    return { valid: false, error: "Invalid playground key signature" };
  }

  const user = await db.queryOne<UserRecord>(
    `SELECT * FROM kiosai.users WHERE id = ?`,
    [userId]
  );
  if (!user) return { valid: false, error: "User account not found" };

  if (Number(user.balance_tokens) <= 0) {
    return { valid: false, error: "Token balance exhausted. Please top up." };
  }

  const key: ApiKeyRecord = {
    id: `pg-${userId}`,
    user_id: userId,
    key_hash: `pg-hash-${userId}`,
    key_prefix: "kios-pg",
    name: "Playground Session",
    rate_limit_per_min: 120,
    allowed_models: null,
    is_active: 1,
    last_used_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  return { valid: true, user, key };
}
