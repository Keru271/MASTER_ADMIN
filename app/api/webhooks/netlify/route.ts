import { NextRequest, NextResponse } from "next/server";
import { deploymentsStore } from "@/lib/deploymentsStore";

export const dynamic = "force-dynamic";

/**
 * Netlify Deployments Webhook Endpoint
 * 
 * Configured in Netlify Dashboard:
 * Site configuration -> Build & deploy -> Deploy notifications -> Add notification -> Outgoing webhook
 * URL: https://<master-admin-domain>/api/webhooks/netlify
 * Events: Deploy started, Deploy succeeded, Deploy failed
 */

export async function POST(req: NextRequest) {
  try {
    const eventHeader = req.headers.get("x-netlify-event") || undefined;
    const authHeader = req.headers.get("x-webhook-secret") || req.headers.get("x-netlify-token") || "";
    
    // Optional secret verification
    const expectedSecret = process.env.NETLIFY_WEBHOOK_SECRET;
    const urlSecret = req.nextUrl.searchParams.get("token") || req.nextUrl.searchParams.get("secret");

    if (expectedSecret && authHeader !== expectedSecret && urlSecret !== expectedSecret) {
      console.warn("[NetlifyWebhook] Unauthorized webhook call received. Secret mismatch.");
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing webhook secret." },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid payload: Expected JSON object." },
        { status: 400 }
      );
    }

    const recorded = deploymentsStore.recordWebhook(body, eventHeader);

    return NextResponse.json({
      success: true,
      message: `Netlify deploy status recorded: ${recorded.statusText}`,
      deployment: {
        id: recorded.id,
        siteName: recorded.siteName,
        url: recorded.url,
        state: recorded.state,
        isCompleted: recorded.isCompleted,
        statusText: recorded.statusText,
        branch: recorded.branch,
        commitRef: recorded.commitRef,
        deployTime: recorded.deployTime,
        publishedAt: recorded.publishedAt,
        receivedAt: recorded.receivedAt,
      },
    });
  } catch (err: any) {
    console.error("[NetlifyWebhook] Error processing incoming webhook:", err);
    return NextResponse.json(
      { error: "Failed to process webhook.", details: err.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const action = searchParams.get("action");
    const id = searchParams.get("id");
    const verifyUrl = searchParams.get("verifyUrl");

    // Live site reachability verification
    if (action === "verify" && verifyUrl) {
      const result = await deploymentsStore.verifyLiveSite(verifyUrl);
      return NextResponse.json({
        success: true,
        url: verifyUrl,
        ...result,
      });
    }

    // Specific deployment lookup
    if (id) {
      const deploy = deploymentsStore.getDeploymentById(id);
      if (!deploy) {
        return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        deployment: deploy,
        isCompleted: deploy.isCompleted,
      });
    }

    const deployments = deploymentsStore.getDeployments();
    const stats = deploymentsStore.getStats();

    return NextResponse.json({
      success: true,
      stats,
      deployments,
      webhookPath: "/api/webhooks/netlify",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[NetlifyWebhook] Error in GET handler:", err);
    return NextResponse.json(
      { error: "Failed to load deployment data.", details: err.message },
      { status: 500 }
    );
  }
}

// Simulate a deployment for testing
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const siteName = body.siteName || "omnistore-storefront";
    const statusType = body.statusType || "ready"; // 'ready', 'building', 'error'

    const simulatedPayload = {
      id: `sim_${Date.now()}`,
      site_id: body.siteId || "site_sim_12345",
      name: siteName,
      url: body.url || `https://${siteName}.netlify.app`,
      ssl_url: body.url || `https://${siteName}.netlify.app`,
      deploy_url: `https://sim-${Date.now()}--${siteName}.netlify.app`,
      state: statusType,
      branch: body.branch || "main",
      commit_ref: "a1b2c3d",
      title: body.title || "Feature: Dynamic storefront theme updates",
      deploy_time: statusType === "ready" ? 38 : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: statusType === "ready" ? new Date().toISOString() : undefined,
      error_message: statusType === "error" ? "Command failed: npm run build with exit code 1" : null,
    };

    const eventName =
      statusType === "ready"
        ? "deploy_succeeded"
        : statusType === "error"
        ? "deploy_failed"
        : "deploy_building";

    const recorded = deploymentsStore.recordWebhook(simulatedPayload, eventName);

    return NextResponse.json({
      success: true,
      simulated: true,
      message: `Simulated ${eventName} webhook recorded successfully!`,
      deployment: recorded,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create simulated deployment.", details: err.message },
      { status: 500 }
    );
  }
}

// Clear deployment logs
export async function DELETE() {
  try {
    deploymentsStore.clearDeployments();
    return NextResponse.json({
      success: true,
      message: "Deployment logs successfully cleared.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to clear logs.", details: err.message },
      { status: 500 }
    );
  }
}
