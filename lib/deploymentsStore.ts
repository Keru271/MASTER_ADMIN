import fs from "fs";
import path from "path";

export interface NetlifyDeployment {
  id: string;
  siteId: string;
  siteName: string;
  url: string;
  sslUrl?: string;
  deployUrl?: string;
  deploySslUrl?: string;
  state: "ready" | "building" | "enqueued" | "error" | "cancelled";
  isCompleted: boolean;
  statusText: string;
  errorMessage?: string | null;
  branch?: string;
  commitRef?: string;
  commitUrl?: string;
  title?: string;
  context?: string;
  deployTime?: number; // in seconds
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  event?: string; // deploy_succeeded, deploy_failed, deploy_building, deploy_created
  receivedAt: string;
  rawPayload?: any;
}

export interface DeploymentStats {
  total: number;
  completed: number;
  building: number;
  failed: number;
  averageDeployTimeSeconds: number;
  latestDeploy?: NetlifyDeployment;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "netlify-deployments.json");

// In-memory cache
let inMemoryDeployments: NetlifyDeployment[] | null = null;

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      // Initialize with empty array
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
    }
  } catch (err) {
    console.warn("[DeploymentsStore] Warning initializing data directory:", err);
  }
}

function loadDeployments(): NetlifyDeployment[] {
  if (inMemoryDeployments !== null) {
    return inMemoryDeployments;
  }

  ensureDataFile();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      inMemoryDeployments = JSON.parse(content || "[]");
      return inMemoryDeployments!;
    }
  } catch (err) {
    console.error("[DeploymentsStore] Error reading deployments file:", err);
  }

  inMemoryDeployments = [];
  return inMemoryDeployments;
}

function persistDeployments(deployments: NetlifyDeployment[]) {
  inMemoryDeployments = deployments;
  ensureDataFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(deployments, null, 2), "utf-8");
  } catch (err) {
    console.error("[DeploymentsStore] Error writing deployments file:", err);
  }
}

export const deploymentsStore = {
  getDeployments(): NetlifyDeployment[] {
    const list = loadDeployments();
    // Return sorted newest first
    return [...list].sort(
      (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
  },

  getDeploymentById(id: string): NetlifyDeployment | undefined {
    const list = loadDeployments();
    return list.find((d) => d.id === id);
  },

  recordWebhook(payload: any, eventHeader?: string): NetlifyDeployment {
    const list = loadDeployments();

    const id = payload.id || `deploy_${Date.now()}`;
    const stateRaw = String(payload.state || payload.status || "ready").toLowerCase();
    
    // Netlify states: 'ready' (deploy_succeeded), 'building', 'enqueued', 'error' (deploy_failed), 'cancelled'
    let state: NetlifyDeployment["state"] = "ready";
    if (stateRaw === "error" || eventHeader === "deploy_failed") {
      state = "error";
    } else if (stateRaw === "building" || eventHeader === "deploy_building") {
      state = "building";
    } else if (stateRaw === "enqueued" || eventHeader === "deploy_created") {
      state = "enqueued";
    } else if (stateRaw === "cancelled") {
      state = "cancelled";
    } else {
      state = "ready";
    }

    const isCompleted = state === "ready";
    const statusText =
      state === "ready"
        ? "Completed (Live)"
        : state === "building"
        ? "Building..."
        : state === "enqueued"
        ? "Enqueued in Queue"
        : state === "error"
        ? "Deployment Failed"
        : "Cancelled";

    const siteName =
      payload.name ||
      payload.site_name ||
      (payload.url ? new URL(payload.url).hostname.replace(".netlify.app", "") : "Netlify Storefront");

    const record: NetlifyDeployment = {
      id,
      siteId: payload.site_id || payload.siteId || "unknown-site",
      siteName,
      url: payload.url || payload.ssl_url || (payload.name ? `https://${payload.name}.netlify.app` : "https://netlify.app"),
      sslUrl: payload.ssl_url || payload.url,
      deployUrl: payload.deploy_url || payload.deploy_ssl_url || payload.url,
      deploySslUrl: payload.deploy_ssl_url || payload.deploy_url,
      state,
      isCompleted,
      statusText,
      errorMessage: payload.error_message || (state === "error" ? "Build or deploy failure occurred on Netlify." : null),
      branch: payload.branch || payload.build_branch || "main",
      commitRef: payload.commit_ref || payload.commit_id ? String(payload.commit_ref || payload.commit_id).slice(0, 8) : undefined,
      commitUrl: payload.commit_url || undefined,
      title: payload.title || payload.summary?.messages?.[0] || payload.commit_message || "Manual / Automated Git Build",
      context: payload.context || (payload.branch === "main" ? "production" : "deploy-preview"),
      deployTime: typeof payload.deploy_time === "number" ? payload.deploy_time : undefined,
      createdAt: payload.created_at || new Date().toISOString(),
      updatedAt: payload.updated_at || new Date().toISOString(),
      publishedAt: payload.published_at || (isCompleted ? new Date().toISOString() : undefined),
      event: eventHeader || (state === "ready" ? "deploy_succeeded" : state === "error" ? "deploy_failed" : "deploy_building"),
      receivedAt: new Date().toISOString(),
      rawPayload: payload,
    };

    // Replace if exists, or prepend
    const existingIndex = list.findIndex((d) => d.id === record.id);
    if (existingIndex >= 0) {
      list[existingIndex] = record;
    } else {
      list.unshift(record);
    }

    // Keep up to 150 deployments
    const pruned = list.slice(0, 150);
    persistDeployments(pruned);

    console.log(`[DeploymentsStore] Processed Netlify webhook for site "${record.siteName}": ${record.statusText} (${record.id})`);
    return record;
  },

  getStats(): DeploymentStats {
    const list = this.getDeployments();
    const total = list.length;
    const completed = list.filter((d) => d.isCompleted).length;
    const building = list.filter((d) => d.state === "building" || d.state === "enqueued").length;
    const failed = list.filter((d) => d.state === "error").length;

    const times = list.filter((d) => typeof d.deployTime === "number").map((d) => d.deployTime!);
    const averageDeployTimeSeconds =
      times.length > 0 ? Math.round(times.reduce((sum, t) => sum + t, 0) / times.length) : 0;

    return {
      total,
      completed,
      building,
      failed,
      averageDeployTimeSeconds,
      latestDeploy: list[0] || undefined,
    };
  },

  async verifyLiveSite(targetUrl: string): Promise<{
    isLive: boolean;
    statusCode: number | null;
    latencyMs: number;
    isNetlify: boolean;
    serverHeader?: string;
    error?: string;
  }> {
    const startTime = Date.now();
    try {
      const urlWithProtocol = targetUrl.startsWith("http://") || targetUrl.startsWith("https://")
        ? targetUrl
        : `https://${targetUrl}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(urlWithProtocol, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "CMS-Master-Admin-Netlify-Verifier/1.0",
          Accept: "*/*",
        },
        cache: "no-store",
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      const isSuccess = response.status >= 200 && response.status < 400;
      const serverHeader = response.headers.get("server") || "";
      const netlifyHeader = response.headers.get("x-nf-request-id");
      const isNetlify = serverHeader.toLowerCase().includes("netlify") || !!netlifyHeader;

      return {
        isLive: isSuccess,
        statusCode: response.status,
        latencyMs,
        isNetlify,
        serverHeader: serverHeader || undefined,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        isLive: false,
        statusCode: null,
        latencyMs,
        isNetlify: false,
        error: err.name === "AbortError" ? "Connection timed out after 6000ms" : err.message || "Failed to reach site",
      };
    }
  },

  clearDeployments(): void {
    persistDeployments([]);
  },
};
