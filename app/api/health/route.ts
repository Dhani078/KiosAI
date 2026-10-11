import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UPSTREAM_URL, UPSTREAM_KEY } from "@/lib/proxy-http";

export const runtime = "nodejs";

export async function GET() {
  const result: {
    status: "healthy" | "degraded" | "unhealthy";
    database: { status: string; latencyMs: number };
    upstream: { status: string; latencyMs: number };
    timestamp: string;
  } = {
    status: "healthy",
    database: { status: "disconnected", latencyMs: 0 },
    upstream: { status: "disconnected", latencyMs: 0 },
    timestamp: new Date().toISOString(),
  };

  // 1. Check TiDB Serverless
  const dbStart = Date.now();
  try {
    await db.query("SELECT 1 as ping");
    result.database = { status: "connected", latencyMs: Date.now() - dbStart };
  } catch (err: any) {
    result.database = { status: `error: ${err.message}`, latencyMs: Date.now() - dbStart };
    result.status = "degraded";
  }

  // 2. Check 9Router Upstream
  const upStart = Date.now();
  try {
    const res = await fetch(`${UPSTREAM_URL}/v1/models`, {
      headers: UPSTREAM_KEY ? { Authorization: `Bearer ${UPSTREAM_KEY}` } : {},
      signal: AbortSignal.timeout(5000),
    });
    result.upstream = {
      status: res.ok ? "connected" : `http_${res.status}`,
      latencyMs: Date.now() - upStart,
    };
    if (!res.ok) result.status = "degraded";
  } catch (err: any) {
    result.upstream = { status: `error: ${err.message}`, latencyMs: Date.now() - upStart };
    result.status = "degraded";
  }

  const statusCode = result.status === "healthy" ? 200 : result.status === "degraded" ? 200 : 503;
  return NextResponse.json(result, { status: statusCode });
}
