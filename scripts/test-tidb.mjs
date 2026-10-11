import { connect } from '@tidbcloud/serverless';

const url = process.env.DATABASE_URL;
console.log('Testing TiDB connection to:', url ? url.split('@')[1] : 'NO URL');

try {
  const conn = connect({ url });
  const result = await conn.execute('SELECT 1 as connected');
  console.log('Connection test result:', result);
} catch (err) {
  console.error('Connection failed:', err);
  process.exit(1);
}
