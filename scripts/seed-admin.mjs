import { connect } from "@tidbcloud/serverless";
import crypto from "crypto";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString("hex");
const hash = crypto.scryptSync("dhaniforadmin", salt, 64).toString("hex");
const combined = `${salt}:${hash}`;

const conn = connect({ url: dbUrl });

await conn.execute(`
  INSERT INTO kiosai.users (id, email, password_hash, full_name, tier, balance_tokens)
  VALUES ('usr_admin_dhani', 'adminfordhani@kiosai.id', ?, 'Admin Dhani', 'gold', 100000000)
  ON DUPLICATE KEY UPDATE 
    password_hash = ?,
    tier = 'gold',
    balance_tokens = 100000000,
    full_name = 'Admin Dhani'
`, [combined, combined]);

const user = await conn.execute(
  "SELECT id, email, full_name, tier, balance_tokens FROM kiosai.users WHERE id = 'usr_admin_dhani'"
);
console.log("Admin seeded successfully:", JSON.stringify(user));
