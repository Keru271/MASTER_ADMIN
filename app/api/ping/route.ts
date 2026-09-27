import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface PingResult {
  url: string;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  statusCode: number | null;
  statusText: string;
  latencyMs: number;
  timestamp: string;
  error?: string;
}

async function pingSingleUrl(targetUrl: string, timeoutMs: number = 4000): Promise<PingResult> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "CMS-Master-Admin-Ping-Monitor/1.0",
        "Accept": "*/*",
      },
      cache: "no-store",
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const isSuccess = response.status >= 200 && response.status < 400;

    let status: "ONLINE" | "DEGRADED" | "OFFLINE" = isSuccess ? "ONLINE" : "DEGRADED";
    if (latencyMs > 1500) {
      status = "DEGRADED";
    }

    return {
      url: targetUrl,
      status,
      statusCode: response.status,
      statusText: response.statusText || (isSuccess ? "OK" : "HTTP Error"),
      latencyMs,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const isTimeout = err.name === "AbortError";

    return {
      url: targetUrl,
      status: "OFFLINE",
      statusCode: null,
      statusText: isTimeout ? "Timeout" : "Connection Refused",
      latencyMs,
      timestamp: new Date().toISOString(),
      error: isTimeout ? `Request timed out after ${timeoutMs}ms` : err.message || "Unreachable host",
    };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing 'url' query parameter" }, { status: 400 });
  }

  const result = await pingSingleUrl(targetUrl);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const urls: string[] = Array.isArray(body.urls) ? body.urls : body.url ? [body.url] : [];

    if (urls.length === 0) {
      return NextResponse.json({ error: "No target URLs provided" }, { status: 400 });
    }

    // Ping all requested URLs concurrently
    const results = await Promise.all(urls.map((u) => pingSingleUrl(u)));
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid ping request payload" }, { status: 400 });
  }
}
