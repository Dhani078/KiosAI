/**
 * One-time data migration: collapse the legacy 5-tier schema into the 2-tier
 * model (free | pro). Code already speaks free/pro; existing rows still hold
 * bronze/silver/gold, which leaks back into the UI as a GOLD badge.
 *
 * Idempotent — safe to re-run. Run: npm run migrate:tiers
 */
import { connect } from "@tidbcloud/serverless";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing in environment");
  process.exit(1);
}
const conn = connect({ url });

/** bronze (25k) / silver (100k) / gold (150k) all become pro. */
const LEGACY_TIERS = ["bronze", "silver", "gold", "starter"];

async function main() {
  console.log("--- KiosAI 2-tier data migration ---");

  // 0. Backup every row we are about to rewrite, so this stays reversible.
  const userRows = await conn.execute(
    `SELECT id, tier FROM kiosai.users WHERE tier NOT IN ('free','pro')`,
  );
  const orderRows = await conn.execute(
    `SELECT id, package_tier FROM kiosai.orders WHERE package_tier NOT IN ('free','pro')`,
  );
  const dir = join("backups");
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = join(dir, `tier-migration-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify({ users: userRows, orders: orderRows }, null, 2));
  console.log(`backup: ${backupPath} (${userRows.length} users, ${orderRows.length} orders)`);

  // 1. users.tier
  for (const legacy of LEGACY_TIERS) {
    const r = await conn.execute(
      `UPDATE kiosai.users SET tier = 'pro' WHERE tier = ?`,
      [legacy],
    );
    const n = Number(r?.affectedRows ?? r?.rowsAffected ?? 0);
    if (n) console.log(`users: ${legacy} -> pro (${n} row)`);
  }

  // 2. orders.package_tier — keep the historical name in tokens/amount, only
  //    normalize the tier label so the history table stops rendering badges
  //    for tiers that no longer exist.
  for (const legacy of LEGACY_TIERS) {
    const r = await conn.execute(
      `UPDATE kiosai.orders SET package_tier = 'pro' WHERE package_tier = ?`,
      [legacy],
    );
    const n = Number(r?.affectedRows ?? r?.rowsAffected ?? 0);
    if (n) console.log(`orders: ${legacy} -> pro (${n} row)`);
  }

  // 3. Anything outside the 2-tier set is not reachable in the product.
  const strays = await conn.execute(
    `SELECT tier, COUNT(*) AS n FROM kiosai.users WHERE tier NOT IN ('free','pro') GROUP BY tier`,
  );
  console.log("remaining non free/pro user tiers:", JSON.stringify(strays));

  const straysOrders = await conn.execute(
    `SELECT package_tier, COUNT(*) AS n FROM kiosai.orders WHERE package_tier NOT IN ('free','pro') GROUP BY package_tier`,
  );
  console.log("remaining non free/pro order tiers:", JSON.stringify(straysOrders));

  const users = await conn.execute(`SELECT tier, COUNT(*) AS n FROM kiosai.users GROUP BY tier`);
  const orders = await conn.execute(`SELECT package_tier, COUNT(*) AS n FROM kiosai.orders GROUP BY package_tier`);
  console.log("users by tier: ", JSON.stringify(users));
  console.log("orders by tier:", JSON.stringify(orders));

  const bad = [...strays, ...straysOrders].length > 0;
  console.log(bad ? "\nMigration incomplete — strays remain." : "\nMigration complete: every row is free or pro.");
  process.exit(bad ? 1 : 0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});