import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "usr_kiosai_demo";

  try {
    // 1. Overall totals
    const totals = await db.queryOne<any>(
      `SELECT 
        COUNT(*) as total_requests,
        COALESCE(SUM(total_tokens), 0) as total_tokens,
        COALESCE(AVG(latency_ms), 0) as avg_latency_ms
       FROM kiosai.usage_logs 
       WHERE user_id = ?`,
      [userId]
    );

    // 2. Breakdown per model
    const perModel = await db.query<any>(
      `SELECT 
        model,
        COUNT(*) as requests,
        SUM(total_tokens) as tokens,
        ROUND(AVG(latency_ms)) as avg_latency
       FROM kiosai.usage_logs 
       WHERE user_id = ?
       GROUP BY model
       ORDER BY tokens DESC`,
      [userId]
    );

    // 3. Recent 20 logs
    const logs = await db.query<any>(
      `SELECT 
        id, model, prompt_tokens, completion_tokens, total_tokens, latency_ms, status_code, created_at
       FROM kiosai.usage_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    return NextResponse.json({
      summary: {
        totalRequests: Number(totals?.total_requests || 0),
        totalTokens: Number(totals?.total_tokens || 0),
        avgLatencyMs: Math.round(Number(totals?.avg_latency_ms || 0)),
      },
      perModel,
      recentLogs: logs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
