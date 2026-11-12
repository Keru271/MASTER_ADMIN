import { NextRequest, NextResponse } from "next/server";
import { deploymentsStore, ServiceId } from "@/lib/deploymentsStore";

export const dynamic = "force-dynamic";

// GET /api/deployments - Retrieve all 4 services, trigger logs, stats, and webhooks
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const action = searchParams.get("action");
    const serviceId = searchParams.get("serviceId") as ServiceId | null;
    const verifyUrl = searchParams.get("verifyUrl");

    // Ping check
    if (action === "verify" && verifyUrl) {
      const result = await deploymentsStore.verifyLiveSite(verifyUrl);
      return NextResponse.json({
        success: true,
        url: verifyUrl,
        ...result,
      });
    }

    // Specific service detail
    if (serviceId) {
      const service = deploymentsStore.getServiceById(serviceId);
      if (!service) {
        return NextResponse.json({ error: "Service not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, service });
    }

    const services = deploymentsStore.getServices();
    const triggerLogs = deploymentsStore.getTriggerLogs();
    const webhookDeployments = deploymentsStore.getDeployments();
    const stats = deploymentsStore.getStats();

    return NextResponse.json({
      success: true,
      services,
      triggerLogs,
      webhookDeployments,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[DeploymentsAPI] Error handling GET:", err);
    return NextResponse.json(
      { error: "Failed to load deployment data.", details: err.message },
      { status: 500 }
    );
  }
}

// POST /api/deployments - Trigger deploy hook for one or all services
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const serviceId = body.serviceId as ServiceId | "all";
    const clearCache = Boolean(body.clearCache);

    if (!serviceId) {
      return NextResponse.json(
        { error: "Missing required 'serviceId' in request body." },
        { status: 400 }
      );
    }

    if (serviceId === "all") {
      const results = await deploymentsStore.triggerAllDeployments({ clearCache });
      const allSuccess = results.every((r) => r.success);
      return NextResponse.json({
        success: allSuccess,
        message: allSuccess
          ? "All 4 deployments dispatched successfully!"
          : "Some deployments failed to trigger. Review individual status.",
        results,
        services: deploymentsStore.getServices(),
      });
    }

    const result = await deploymentsStore.triggerDeployment(serviceId, { clearCache });

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Successfully triggered deployment for ${result.log.serviceName}!`
        : `Failed to trigger deployment: ${result.error}`,
      log: result.log,
      service: deploymentsStore.getServiceById(serviceId),
    });
  } catch (err: any) {
    console.error("[DeploymentsAPI] Error triggering deployment:", err);
    return NextResponse.json(
      { error: err.message || "Failed to trigger deployment hook." },
      { status: 500 }
    );
  }
}

// PUT /api/deployments - Update service hook URL or live URL
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const serviceId = body.serviceId as ServiceId;

    if (!serviceId) {
      return NextResponse.json(
        { error: "Missing required 'serviceId' in request body." },
        { status: 400 }
      );
    }

    if (body.reset) {
      const reset = deploymentsStore.resetService(serviceId);
      return NextResponse.json({
        success: true,
        message: `Reset ${reset.name} configuration to system default.`,
        service: reset,
      });
    }

    const updated = deploymentsStore.updateService(serviceId, {
      hookUrl: body.hookUrl,
      liveUrl: body.liveUrl,
      description: body.description,
    });

    return NextResponse.json({
      success: true,
      message: `Updated configuration for ${updated.name}.`,
      service: updated,
    });
  } catch (err: any) {
    console.error("[DeploymentsAPI] Error updating service config:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update service." },
      { status: 500 }
    );
  }
}

// DELETE /api/deployments - Clear trigger logs or reset
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const target = searchParams.get("target") || "triggers";

    if (target === "webhooks") {
      deploymentsStore.clearDeployments();
      return NextResponse.json({
        success: true,
        message: "Webhook deployment history cleared.",
      });
    }

    deploymentsStore.clearTriggerLogs();
    return NextResponse.json({
      success: true,
      message: "Deployment trigger history cleared.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to clear logs.", details: err.message },
      { status: 500 }
    );
  }
}

