import fs from "fs";
import path from "path";

export type ServiceId =
  | "cms-frontend"
  | "storefront-frontend"
  | "cms-backend"
  | "storefront-backend";

export type Provider = "netlify" | "render";
export type ServiceType = "frontend" | "backend";

export interface DeployServiceConfig {
  id: ServiceId;
  name: string;
  type: ServiceType;
  provider: Provider;
  hookUrl: string;
  defaultHookUrl: string;
  envKey: string;
  liveUrl: string;
  description: string;
  status: "idle" | "triggering" | "building" | "ready" | "error";
  lastTriggeredAt?: string;
  lastTriggerStatus?: "SUCCESS" | "FAILED";
  lastTriggerMessage?: string;
  lastDeployId?: string;
  lastPingStatus?: {
    isLive: boolean;
    statusCode: number | null;
    latencyMs: number;
    checkedAt: string;
    serverHeader?: string;
    error?: string;
  };
}

export interface DeploymentTriggerLog {
  id: string;
  serviceId: ServiceId;
  serviceName: string;
  provider: Provider;
  hookUrl: string;
  status: "SUCCESS" | "FAILED";
  statusCode?: number;
  message: string;
  details?: any;
  durationMs: number;
  triggeredAt: string;
  clearCache?: boolean;
}

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
  event?: string;
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
  totalTriggers?: number;
  successfulTriggers?: number;
  failedTriggers?: number;
  lastTriggeredAt?: string;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const NETLIFY_DATA_FILE = path.join(DATA_DIR, "netlify-deployments.json");
const SERVICES_DATA_FILE = path.join(DATA_DIR, "deploy-services.json");
const TRIGGERS_DATA_FILE = path.join(DATA_DIR, "deploy-triggers.json");

// Default service definitions
export const DEFAULT_SERVICES: DeployServiceConfig[] = [
  {
    id: "cms-frontend",
    name: "CMS Frontend",
    type: "frontend",
    provider: "netlify",
    hookUrl:
      process.env.CMS_FRONTEND_BUILD_HOOK ||
      "https://api.netlify.com/build_hooks/6af2056df4d574944d1fbba1",
    defaultHookUrl: "https://api.netlify.com/build_hooks/6af2056df4d574944d1fbba1",
    envKey: "CMS_FRONTEND_BUILD_HOOK",
    liveUrl: "https://omnistore-cms.netlify.app",
    description: "Next.js Merchant Admin & Multi-tenant CMS Dashboard",
    status: "idle",
  },
  {
    id: "storefront-frontend",
    name: "Storefront Frontend",
    type: "frontend",
    provider: "netlify",
    hookUrl:
      process.env.STOREFRONT_FRONTEND_BUILD_HOOK ||
      "https://api.netlify.com/build_hooks/6af205d212c10085f68df573",
    defaultHookUrl: "https://api.netlify.com/build_hooks/6af205d212c10085f68df573",
    envKey: "STOREFRONT_FRONTEND_BUILD_HOOK",
    liveUrl: "https://serene-croissant-868f08.netlify.app",
    description: "Customer-facing E-Commerce Storefront (FO) Web App",
    status: "idle",
  },
  {
    id: "cms-backend",
    name: "CMS Backend",
    type: "backend",
    provider: "render",
    hookUrl:
      process.env.CMS_BACKEND_DEPLOY_HOOK ||
      "https://api.render.com/deploy/srv-da7i6l942hec73bu2ec0?key=3ng7wGHX1O4",
    defaultHookUrl:
      "https://api.render.com/deploy/srv-da7i6l942hec73bu2ec0?key=3ng7wGHX1O4",
    envKey: "CMS_BACKEND_DEPLOY_HOOK",
    liveUrl: "https://cms-backend.onrender.com",
    description: "CMS REST API, Multi-tenant DB Engine & Auth Service",
    status: "idle",
  },
  {
    id: "storefront-backend",
    name: "Storefront Backend",
    type: "backend",
    provider: "render",
    hookUrl:
      process.env.STOREFRONT_BACKEND_DEPLOY_HOOK ||
      "https://api.render.com/deploy/srv-da7i6l942hec73bu2ec0?key=3ng7wGHX1O4",
    defaultHookUrl:
      "https://api.render.com/deploy/srv-da7i6l942hec73bu2ec0?key=3ng7wGHX1O4",
    envKey: "STOREFRONT_BACKEND_DEPLOY_HOOK",
    liveUrl: "https://storefront-backend.onrender.com",
    description: "Storefront Catalog, Cart & Checkout Backend Service",
    status: "idle",
  },
];

// In-memory caches
let inMemoryDeployments: NetlifyDeployment[] | null = null;
let inMemoryServices: DeployServiceConfig[] | null = null;
let inMemoryTriggers: DeploymentTriggerLog[] | null = null;

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("[DeploymentsStore] Warning ensuring data directory:", err);
  }
}

function loadDeployments(): NetlifyDeployment[] {
  if (inMemoryDeployments !== null) {
    return inMemoryDeployments;
  }
  ensureDataDir();
  try {
    if (fs.existsSync(NETLIFY_DATA_FILE)) {
      const content = fs.readFileSync(NETLIFY_DATA_FILE, "utf-8");
      inMemoryDeployments = JSON.parse(content || "[]");
      return inMemoryDeployments!;
    }
  } catch (err) {
    console.error("[DeploymentsStore] Error reading netlify deployments file:", err);
  }
  inMemoryDeployments = [];
  return inMemoryDeployments;
}

function persistDeployments(deployments: NetlifyDeployment[]) {
  inMemoryDeployments = deployments;
  ensureDataDir();
  try {
    fs.writeFileSync(NETLIFY_DATA_FILE, JSON.stringify(deployments, null, 2), "utf-8");
  } catch (err) {
    console.error("[DeploymentsStore] Error writing netlify deployments file:", err);
  }
}

function loadServices(): DeployServiceConfig[] {
  if (inMemoryServices !== null) {
    return inMemoryServices;
  }
  ensureDataDir();
  try {
    if (fs.existsSync(SERVICES_DATA_FILE)) {
      const content = fs.readFileSync(SERVICES_DATA_FILE, "utf-8");
      const saved: Partial<DeployServiceConfig>[] = JSON.parse(content || "[]");

      // Merge saved overrides with current defaults & env vars
      inMemoryServices = DEFAULT_SERVICES.map((def) => {
        const found = saved.find((s) => s.id === def.id);
        const envHook = process.env[def.envKey];
        return {
          ...def,
          ...(found || {}),
          // Env var takes precedence over old saved hook if env var is explicitly provided
          hookUrl: envHook || found?.hookUrl || def.hookUrl,
          defaultHookUrl: def.defaultHookUrl,
          envKey: def.envKey,
        };
      });
      return inMemoryServices;
    }
  } catch (err) {
    console.error("[DeploymentsStore] Error reading services file:", err);
  }

  // Fallback to defaults
  inMemoryServices = DEFAULT_SERVICES.map((def) => {
    const envHook = process.env[def.envKey];
    return {
      ...def,
      hookUrl: envHook || def.hookUrl,
    };
  });
  return inMemoryServices;
}

function persistServices(services: DeployServiceConfig[]) {
  inMemoryServices = services;
  ensureDataDir();
  try {
    fs.writeFileSync(SERVICES_DATA_FILE, JSON.stringify(services, null, 2), "utf-8");
  } catch (err) {
    console.error("[DeploymentsStore] Error writing services file:", err);
  }
}

function loadTriggers(): DeploymentTriggerLog[] {
  if (inMemoryTriggers !== null) {
    return inMemoryTriggers;
  }
  ensureDataDir();
  try {
    if (fs.existsSync(TRIGGERS_DATA_FILE)) {
      const content = fs.readFileSync(TRIGGERS_DATA_FILE, "utf-8");
      inMemoryTriggers = JSON.parse(content || "[]");
      return inMemoryTriggers!;
    }
  } catch (err) {
    console.error("[DeploymentsStore] Error reading triggers file:", err);
  }
  inMemoryTriggers = [];
  return inMemoryTriggers;
}

function persistTriggers(triggers: DeploymentTriggerLog[]) {
  inMemoryTriggers = triggers;
  ensureDataDir();
  try {
    fs.writeFileSync(TRIGGERS_DATA_FILE, JSON.stringify(triggers, null, 2), "utf-8");
  } catch (err) {
    console.error("[DeploymentsStore] Error writing triggers file:", err);
  }
}

export const deploymentsStore = {
  // Service management
  getServices(): DeployServiceConfig[] {
    return loadServices();
  },

  getServiceById(id: ServiceId): DeployServiceConfig | undefined {
    const services = loadServices();
    return services.find((s) => s.id === id);
  },

  updateService(
    id: ServiceId,
    updates: Partial<Pick<DeployServiceConfig, "hookUrl" | "liveUrl" | "description">>
  ): DeployServiceConfig {
    const services = loadServices();
    const index = services.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Service not found: ${id}`);
    }

    services[index] = {
      ...services[index],
      ...updates,
    };

    persistServices(services);
    return services[index];
  },

  resetService(id: ServiceId): DeployServiceConfig {
    const services = loadServices();
    const index = services.findIndex((s) => s.id === id);
    const def = DEFAULT_SERVICES.find((d) => d.id === id);
    if (index === -1 || !def) {
      throw new Error(`Service not found: ${id}`);
    }

    const envHook = process.env[def.envKey];
    services[index] = {
      ...def,
      hookUrl: envHook || def.defaultHookUrl,
    };

    persistServices(services);
    return services[index];
  },

  // Trigger single deployment
  async triggerDeployment(
    serviceId: ServiceId,
    options?: { clearCache?: boolean }
  ): Promise<{ success: boolean; log: DeploymentTriggerLog; error?: string }> {
    const services = loadServices();
    const serviceIndex = services.findIndex((s) => s.id === serviceId);
    if (serviceIndex === -1) {
      throw new Error(`Service with ID "${serviceId}" does not exist.`);
    }

    const service = services[serviceIndex];
    let targetUrl = service.hookUrl.trim();

    // Mark as triggering
    service.status = "triggering";
    persistServices(services);

    const startTime = Date.now();
    const triggerId = `trig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      let fetchResponse: Response;

      if (service.provider === "render") {
        // Render deploy hook: POST request
        // Optional clearCache parameter
        if (options?.clearCache) {
          const parsedUrl = new URL(targetUrl);
          parsedUrl.searchParams.set("clearCache", "clear");
          targetUrl = parsedUrl.toString();
        }

        fetchResponse = await fetch(targetUrl, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "User-Agent": "OmniStore-Master-Admin/1.0",
          },
          signal: controller.signal,
        });
      } else {
        // Netlify build hook: POST request
        let payload: any = {
          title: `Deploy triggered from Master Admin (${service.name})`,
        };
        if (options?.clearCache) {
          payload.clear_cache = true;
          // Netlify also supports ?clear_cache=true as query param
          if (!targetUrl.includes("clear_cache=true")) {
            targetUrl += (targetUrl.includes("?") ? "&" : "?") + "clear_cache=true";
          }
        }

        fetchResponse = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "OmniStore-Master-Admin/1.0",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;
      const isOk = fetchResponse.status >= 200 && fetchResponse.status < 300;

      let responseText = "";
      let responseJson: any = null;
      try {
        responseText = await fetchResponse.text();
        responseJson = JSON.parse(responseText);
      } catch {
        // Not JSON
      }

      const deployId =
        responseJson?.deploy?.id ||
        responseJson?.id ||
        (isOk ? `hook_${Date.now()}` : undefined);

      const statusText = isOk
        ? `Deploy successfully dispatched (${fetchResponse.status} ${fetchResponse.statusText})`
        : `Deployment request rejected (${fetchResponse.status} ${fetchResponse.statusText})`;

      const triggerLog: DeploymentTriggerLog = {
        id: triggerId,
        serviceId: service.id,
        serviceName: service.name,
        provider: service.provider,
        hookUrl: targetUrl,
        status: isOk ? "SUCCESS" : "FAILED",
        statusCode: fetchResponse.status,
        message: statusText,
        details: responseJson || responseText || null,
        durationMs,
        triggeredAt: new Date().toISOString(),
        clearCache: options?.clearCache,
      };

      // Update service status
      service.status = isOk ? "building" : "error";
      service.lastTriggeredAt = triggerLog.triggeredAt;
      service.lastTriggerStatus = isOk ? "SUCCESS" : "FAILED";
      service.lastTriggerMessage = statusText;
      if (deployId) service.lastDeployId = deployId;

      services[serviceIndex] = service;
      persistServices(services);

      // Save log
      const triggers = loadTriggers();
      triggers.unshift(triggerLog);
      persistTriggers(triggers.slice(0, 150));

      return {
        success: isOk,
        log: triggerLog,
        error: isOk ? undefined : statusText,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const isTimeout = err.name === "AbortError";
      const errorMsg = isTimeout
        ? "Deployment request timed out after 12s"
        : err.message || "Failed to dispatch build hook";

      const triggerLog: DeploymentTriggerLog = {
        id: triggerId,
        serviceId: service.id,
        serviceName: service.name,
        provider: service.provider,
        hookUrl: targetUrl,
        status: "FAILED",
        statusCode: 0,
        message: errorMsg,
        details: { error: err.stack || err.message },
        durationMs,
        triggeredAt: new Date().toISOString(),
        clearCache: options?.clearCache,
      };

      service.status = "error";
      service.lastTriggeredAt = triggerLog.triggeredAt;
      service.lastTriggerStatus = "FAILED";
      service.lastTriggerMessage = errorMsg;

      services[serviceIndex] = service;
      persistServices(services);

      const triggers = loadTriggers();
      triggers.unshift(triggerLog);
      persistTriggers(triggers.slice(0, 150));

      return {
        success: false,
        log: triggerLog,
        error: errorMsg,
      };
    }
  },

  // Trigger all 4 deployments simultaneously
  async triggerAllDeployments(options?: { clearCache?: boolean }) {
    const services = loadServices();
    const results = await Promise.all(
      services.map((svc) => this.triggerDeployment(svc.id, options))
    );
    return results;
  },

  // Trigger logs
  getTriggerLogs(): DeploymentTriggerLog[] {
    const logs = loadTriggers();
    return [...logs].sort(
      (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    );
  },

  clearTriggerLogs(): void {
    persistTriggers([]);
  },

  // Netlify webhook deployments
  getDeployments(): NetlifyDeployment[] {
    const list = loadDeployments();
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
      url:
        payload.url ||
        payload.ssl_url ||
        (payload.name ? `https://${payload.name}.netlify.app` : "https://netlify.app"),
      sslUrl: payload.ssl_url || payload.url,
      deployUrl: payload.deploy_url || payload.deploy_ssl_url || payload.url,
      deploySslUrl: payload.deploy_ssl_url || payload.deploy_url,
      state,
      isCompleted,
      statusText,
      errorMessage:
        payload.error_message ||
        (state === "error" ? "Build or deploy failure occurred on Netlify." : null),
      branch: payload.branch || payload.build_branch || "main",
      commitRef:
        payload.commit_ref || payload.commit_id
          ? String(payload.commit_ref || payload.commit_id).slice(0, 8)
          : undefined,
      commitUrl: payload.commit_url || undefined,
      title:
        payload.title ||
        payload.summary?.messages?.[0] ||
        payload.commit_message ||
        "Manual / Automated Git Build",
      context:
        payload.context || (payload.branch === "main" ? "production" : "deploy-preview"),
      deployTime:
        typeof payload.deploy_time === "number" ? payload.deploy_time : undefined,
      createdAt: payload.created_at || new Date().toISOString(),
      updatedAt: payload.updated_at || new Date().toISOString(),
      publishedAt: payload.published_at || (isCompleted ? new Date().toISOString() : undefined),
      event:
        eventHeader ||
        (state === "ready"
          ? "deploy_succeeded"
          : state === "error"
            ? "deploy_failed"
            : "deploy_building"),
      receivedAt: new Date().toISOString(),
      rawPayload: payload,
    };

    // If site matches a frontend service, update service state
    const services = loadServices();
    const matchingService = services.find(
      (s) =>
        s.liveUrl.includes(siteName) ||
        (s.id === "storefront-frontend" && siteName.includes("storefront")) ||
        (s.id === "cms-frontend" && siteName.includes("cms"))
    );
    if (matchingService) {
      matchingService.status = isCompleted ? "ready" : state === "error" ? "error" : "building";
      persistServices(services);
    }

    const existingIndex = list.findIndex((d) => d.id === record.id);
    if (existingIndex >= 0) {
      list[existingIndex] = record;
    } else {
      list.unshift(record);
    }

    const pruned = list.slice(0, 150);
    persistDeployments(pruned);

    console.log(
      `[DeploymentsStore] Processed Netlify webhook for site "${record.siteName}": ${record.statusText} (${record.id})`
    );
    return record;
  },

  getStats(): DeploymentStats {
    const list = this.getDeployments();
    const triggers = this.getTriggerLogs();

    const total = list.length;
    const completed = list.filter((d) => d.isCompleted).length;
    const building = list.filter((d) => d.state === "building" || d.state === "enqueued").length;
    const failed = list.filter((d) => d.state === "error").length;

    const times = list
      .filter((d) => typeof d.deployTime === "number")
      .map((d) => d.deployTime!);
    const averageDeployTimeSeconds =
      times.length > 0 ? Math.round(times.reduce((sum, t) => sum + t, 0) / times.length) : 0;

    const successfulTriggers = triggers.filter((t) => t.status === "SUCCESS").length;
    const failedTriggers = triggers.filter((t) => t.status === "FAILED").length;

    return {
      total,
      completed,
      building,
      failed,
      averageDeployTimeSeconds,
      latestDeploy: list[0] || undefined,
      totalTriggers: triggers.length,
      successfulTriggers,
      failedTriggers,
      lastTriggeredAt: triggers[0]?.triggeredAt,
    };
  },

  async verifyLiveSite(targetUrl: string): Promise<{
    isLive: boolean;
    statusCode: number | null;
    latencyMs: number;
    isNetlify: boolean;
    isRender: boolean;
    serverHeader?: string;
    error?: string;
  }> {
    const startTime = Date.now();
    try {
      const urlWithProtocol =
        targetUrl.startsWith("http://") || targetUrl.startsWith("https://")
          ? targetUrl
          : `https://${targetUrl}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(urlWithProtocol, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "CMS-Master-Admin-Deploy-Verifier/1.0",
          Accept: "*/*",
        },
        cache: "no-store",
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      const isSuccess = response.status >= 200 && response.status < 400;
      const serverHeader = (response.headers.get("server") || "").toLowerCase();
      const netlifyHeader = response.headers.get("x-nf-request-id");
      const renderHeader = response.headers.get("cf-ray") || response.headers.get("x-render-origin-server");

      const isNetlify = serverHeader.includes("netlify") || Boolean(netlifyHeader);
      const isRender = serverHeader.includes("render") || Boolean(renderHeader);

      return {
        isLive: isSuccess,
        statusCode: response.status,
        latencyMs,
        isNetlify,
        isRender,
        serverHeader: serverHeader || undefined,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        isLive: false,
        statusCode: null,
        latencyMs,
        isNetlify: false,
        isRender: false,
        error:
          err.name === "AbortError"
            ? "Connection timed out after 6000ms"
            : err.message || "Failed to reach site",
      };
    }
  },

  clearDeployments(): void {
    persistDeployments([]);
  },
};
