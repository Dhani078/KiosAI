import { connect } from "@tidbcloud/serverless";
import crypto from "crypto";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const conn = connect({ url: dbUrl });

// ponytail: username column is the native fix — no string-mapping hacks in the login route.
try {
  await conn.execute(`ALTER TABLE kiosai.users ADD COLUMN username VARCHAR(64) NULL`);
  await conn.execute(`CREATE UNIQUE INDEX idx_username ON kiosai.users (username)`);
  console.log("username column + unique index added");
} catch (e) {
  console.log("schema already applied:", e.message.slice(0, 120));
}

const salt = crypto.randomBytes(16).toString("hex");
const hash = crypto.scryptSync("dhaniforadmin", salt, 64).toString("hex");
const combined = `${salt}:${hash}`;

await conn.execute(`
  INSERT INTO kiosai.users (id, email, username, password_hash, full_name, tier, balance_tokens)
  VALUES ('usr_admin_dhani', 'adminfordhani@kiosai.id', 'adminfordhani', ?, 'Admin Dhani', 'pro', 100000000)
  ON DUPLICATE KEY UPDATE
    username = 'adminfordhani',
    password_hash = ?,
    tier = 'pro',
    balance_tokens = 100000000,
    full_name = 'Admin Dhani'
`, [combined, combined]);

const user = await conn.execute(
  "SELECT id, email, username, full_name, tier, balance_tokens FROM kiosai.users WHERE id = 'usr_admin_dhani'"
);
console.log("Admin seeded:", JSON.stringify(user));