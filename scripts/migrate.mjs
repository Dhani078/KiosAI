import { connect } from '@tidbcloud/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is missing in environment');
  process.exit(1);
}

const conn = connect({ url });

async function runMigration() {
  console.log('--- Running KiosAI Database Migration on TiDB ---');

  // Create database
  await conn.execute(`CREATE DATABASE IF NOT EXISTS kiosai`);
  console.log('Database kiosai verified.');

  // Switch to kiosai or qualify tables
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS kiosai.users (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(64) NULL,
      password_hash VARCHAR(255) NULL,
      full_name VARCHAR(100),
      tier VARCHAR(20) DEFAULT 'free',
      balance_tokens BIGINT DEFAULT 2500000,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE INDEX idx_username (username),
      INDEX idx_email (email)
    )
  `);
  console.log('Table users verified.');

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS kiosai.api_keys (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      key_hash VARCHAR(64) UNIQUE NOT NULL,
      key_prefix VARCHAR(16) NOT NULL,
      name VARCHAR(100) DEFAULT 'Default Key',
      rate_limit_per_min INT DEFAULT 60,
      allowed_models JSON,
      is_active BOOLEAN DEFAULT TRUE,
      last_used_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_key_hash (key_hash),
      INDEX idx_user (user_id)
    )
  `);
  console.log('Table api_keys verified.');

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS kiosai.orders (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      amount_idr INT NOT NULL,
      tokens_purchased BIGINT NOT NULL,
      package_tier VARCHAR(20) NOT NULL,
      payment_method VARCHAR(32) DEFAULT 'qris',
      status VARCHAR(20) DEFAULT 'pending',
      paid_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_status (status)
    )
  `);
  console.log('Table orders verified.');

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS kiosai.usage_logs (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      api_key_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      model VARCHAR(100) NOT NULL,
      prompt_tokens INT DEFAULT 0,
      completion_tokens INT DEFAULT 0,
      total_tokens INT DEFAULT 0,
      latency_ms INT DEFAULT 0,
      status_code INT DEFAULT 200,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_time (user_id, created_at)
    )
  `);
  console.log('Table usage_logs verified.');

  // Insert default test user if empty
  const users = await conn.execute(`SELECT COUNT(*) as cnt FROM kiosai.users`);
  const count = Number(users[0]?.cnt || 0);
  if (count === 0) {
    const defaultUserId = 'usr_kiosai_demo';
    await conn.execute(`
      INSERT INTO kiosai.users (id, email, full_name, tier, balance_tokens)
      VALUES ('${defaultUserId}', 'demo@kiosai.id', 'Demo User', 'pro', 1000000)
    `);
    console.log('Seeded demo user:', defaultUserId);
  }

  console.log('Migration finished successfully!');
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
