import { connect } from "@tidbcloud/serverless";

function getClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not defined");
  }
  return connect({ url });
}

export const db = {
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const client = getClient();
    const rows = await client.execute(sql, params);
    return rows as T[];
  },
  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] || null;
  },
  async execute(sql: string, params?: any[]) {
    const client = getClient();
    return await client.execute(sql, params);
  },
};
