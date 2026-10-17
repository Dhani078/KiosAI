import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readSessionUserId, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const userId = readSessionUserId(req);
  if (!userId) return unauthorized();

  try {
    // 1. Overall totals with granular metrics
    const totals = await db.queryOne<any>(
      `SELECT 
        COUNT(*) as total_requests,
        COALESCE(SUM(total_tokens), 0) as total_tokens,
        COALESCE(SUM(prompt_tokens), 0) as total_prompt_tokens,
        COALESCE(SUM(completion_tokens), 0) as total_completion_tokens,
        COALESCE(AVG(latency_ms), 0) as avg_latency_ms,
        COALESCE(MIN(latency_ms), 0) as min_latency_ms,
        COALESCE(MAX(latency_ms), 0) as max_latency_ms,
        COALESCE(SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END), 0) as success_requests
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

    // 3. Recent 50 logs for deep exploration
    const logs = await db.query<any>(
      `SELECT 
        id, model, prompt_tokens, completion_tokens, total_tokens, latency_ms, status_code, created_at
       FROM kiosai.usage_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    const totalReqs = Number(totals?.total_requests || 0);
    const successReqs = Number(totals?.success_requests || 0);
    const successRate = totalReqs > 0 ? Math.round((successReqs / totalReqs) * 1000) / 10 : 100;

    return NextResponse.json({
      summary: {
        totalRequests: totalReqs,
        totalTokens: Number(totals?.total_tokens || 0),
        totalPromptTokens: Number(totals?.total_prompt_tokens || 0),
        totalCompletionTokens: Number(totals?.total_completion_tokens || 0),
        avgLatencyMs: Math.round(Number(totals?.avg_latency_ms || 0)),
        minLatencyMs: Math.round(Number(totals?.min_latency_ms || 0)),
        maxLatencyMs: Math.round(Number(totals?.max_latency_ms || 0)),
        successRate,
      },
      perModel,
      recentLogs: logs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
