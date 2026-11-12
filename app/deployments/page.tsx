"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Rocket,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Search,
  Trash2,
  Globe,
  GitBranch,
  Terminal,
  Zap,
  Code,
  Radio,
  Server,
  Database,
  Layers,
  Settings2,
  Play,
  Activity,
  X,
  Edit3,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import {
  DeployServiceConfig,
  DeploymentTriggerLog,
  NetlifyDeployment,
  DeploymentStats,
  ServiceId,
} from "@/lib/deploymentsStore";

export default function DeploymentsHubPage() {
  const [services, setServices] = useState<DeployServiceConfig[]>([]);
  const [triggerLogs, setTriggerLogs] = useState<DeploymentTriggerLog[]>([]);
  const [webhookDeployments, setWebhookDeployments] = useState<NetlifyDeployment[]>([]);
  const [stats, setStats] = useState<DeploymentStats>({
    total: 0,
    completed: 0,
    building: 0,
    failed: 0,
    averageDeployTimeSeconds: 0,
    totalTriggers: 0,
    successfulTriggers: 0,
    failedTriggers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Trigger loading states per service
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [clearCacheOption, setClearCacheOption] = useState<Record<string, boolean>>({});

  // Active tab: 'services' | 'triggers' | 'webhooks'
  const [activeTab, setActiveTab] = useState<"services" | "triggers" | "webhooks">("services");

  // Filters
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [searchLog, setSearchLog] = useState("");

  // Edit Hook Modal state
  const [editingService, setEditingService] = useState<DeployServiceConfig | null>(null);
  const [editHookUrl, setEditHookUrl] = useState("");
  const [editLiveUrl, setEditLiveUrl] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Inspector Modal for trigger logs / webhook payloads
  const [selectedLog, setSelectedLog] = useState<DeploymentTriggerLog | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<NetlifyDeployment | null>(null);

  // Live Ping Verifier state per service
  const [pingResults, setPingResults] = useState<
    Record<
      string,
      {
        loading: boolean;
        isLive?: boolean;
        statusCode?: number | null;
        latencyMs?: number;
        serverHeader?: string;
        isNetlify?: boolean;
        isRender?: boolean;
        error?: string;
      }
    >
  >({});

  // Custom Live URL Verifier
  const [customVerifyUrl, setCustomVerifyUrl] = useState("https://serene-croissant-868f08.netlify.app");
  const [customVerifying, setCustomVerifying] = useState(false);
  const [customVerifyResult, setCustomVerifyResult] = useState<any>(null);

  // Copied states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Toast alert
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const getWebhookUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api/webhooks/netlify`;
    }
    return "/api/webhooks/netlify";
  };

  // Fetch all deployment data
  const loadDeploymentData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await fetch("/api/deployments", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
        setTriggerLogs(data.triggerLogs || []);
        setWebhookDeployments(data.webhookDeployments || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err: any) {
      console.error("Failed to load deployments:", err);
      if (!isSilent) showToast("Failed to fetch deployments from server.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDeploymentData();
  }, [loadDeploymentData]);

  // Auto-refresh polling every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadDeploymentData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadDeploymentData]);

  // Trigger single service deployment
  const handleTriggerDeploy = async (serviceId: ServiceId) => {
    setTriggeringId(serviceId);
    const clearCache = Boolean(clearCacheOption[serviceId]);

    try {
      const res = await fetch("/api/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, clearCache }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `Deployment triggered successfully!`, "success");
      } else {
        showToast(data.message || data.error || `Deployment trigger failed.`, "error");
      }
      await loadDeploymentData(true);
    } catch (err: any) {
      showToast(`Error triggering deploy: ${err.message}`, "error");
    } finally {
      setTriggeringId(null);
    }
  };

  // Trigger all 4 deployments simultaneously
  const handleTriggerAll = async () => {
    if (!confirm("Are you sure you want to trigger deployments for ALL 4 services at once?")) {
      return;
    }
    setTriggeringId("all");
    try {
      const res = await fetch("/api/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: "all" }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("🚀 All 4 platform deployments dispatched successfully!", "success");
      } else {
        showToast(data.message || "Some deployments encountered an issue.", "error");
      }
      await loadDeploymentData(true);
    } catch (err: any) {
      showToast(`Batch trigger error: ${err.message}`, "error");
    } finally {
      setTriggeringId(null);
    }
  };

  // Ping test a service live URL
  const handlePingService = async (service: DeployServiceConfig) => {
    const targetUrl = service.liveUrl;
    if (!targetUrl) {
      showToast(`No live URL configured for ${service.name}.`, "info");
      return;
    }

    setPingResults((prev) => ({
      ...prev,
      [service.id]: { loading: true },
    }));

    try {
      const res = await fetch(
        `/api/deployments?action=verify&verifyUrl=${encodeURIComponent(targetUrl)}`
      );
      const data = await res.json();

      setPingResults((prev) => ({
        ...prev,
        [service.id]: {
          loading: false,
          isLive: data.isLive,
          statusCode: data.statusCode,
          latencyMs: data.latencyMs,
          serverHeader: data.serverHeader,
          isNetlify: data.isNetlify,
          isRender: data.isRender,
          error: data.error,
        },
      }));
    } catch (err: any) {
      setPingResults((prev) => ({
        ...prev,
        [service.id]: {
          loading: false,
          isLive: false,
          statusCode: null,
          latencyMs: 0,
          error: err.message,
        },
      }));
    }
  };

  // Ping test custom URL
  const handlePingCustomUrl = async () => {
    if (!customVerifyUrl) return;
    setCustomVerifying(true);
    setCustomVerifyResult(null);

    try {
      const res = await fetch(
        `/api/deployments?action=verify&verifyUrl=${encodeURIComponent(customVerifyUrl)}`
      );
      const data = await res.json();
      setCustomVerifyResult(data);
    } catch (err: any) {
      setCustomVerifyResult({
        isLive: false,
        statusCode: null,
        latencyMs: 0,
        error: err.message,
      });
    } finally {
      setCustomVerifying(false);
    }
  };

  // Edit hook URL modal open
  const openEditModal = (service: DeployServiceConfig) => {
    setEditingService(service);
    setEditHookUrl(service.hookUrl);
    setEditLiveUrl(service.liveUrl);
  };

  // Save edited hook URL
  const handleSaveEdit = async () => {
    if (!editingService) return;
    setIsSavingEdit(true);

    try {
      const res = await fetch("/api/deployments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: editingService.id,
          hookUrl: editHookUrl.trim(),
          liveUrl: editLiveUrl.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Saved configuration for ${editingService.name}!`);
        setEditingService(null);
        await loadDeploymentData(true);
      } else {
        showToast(data.error || "Failed to save configuration.", "error");
      }
    } catch (err: any) {
      showToast(`Error saving configuration: ${err.message}`, "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Reset service to default hook
  const handleResetService = async (serviceId: ServiceId) => {
    if (!confirm("Reset this service's hook URL to the system default?")) return;
    try {
      const res = await fetch("/api/deployments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, reset: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || "Reset to system default.");
        if (editingService?.id === serviceId) {
          setEditingService(null);
        }
        await loadDeploymentData(true);
      }
    } catch (err: any) {
      showToast(`Reset error: ${err.message}`, "error");
    }
  };

  // Clear trigger logs
  const handleClearTriggers = async () => {
    if (!confirm("Are you sure you want to clear all deployment trigger logs?")) return;
    try {
      const res = await fetch("/api/deployments?target=triggers", { method: "DELETE" });
      if (res.ok) {
        showToast("Trigger audit logs cleared.");
        await loadDeploymentData(true);
      }
    } catch (err: any) {
      showToast("Failed to clear logs.", "error");
    }
  };

  // Filter trigger logs
  const filteredTriggerLogs = triggerLogs.filter((log) => {
    const matchesService = serviceFilter === "ALL" || log.serviceId === serviceFilter;
    const matchesSearch =
      !searchLog.trim() ||
      log.serviceName.toLowerCase().includes(searchLog.toLowerCase()) ||
      log.message.toLowerCase().includes(searchLog.toLowerCase()) ||
      log.hookUrl.toLowerCase().includes(searchLog.toLowerCase()) ||
      log.id.toLowerCase().includes(searchLog.toLowerCase());
    return matchesService && matchesSearch;
  });

  const getServiceIcon = (id: ServiceId) => {
    switch (id) {
      case "cms-frontend":
        return <Layers className="w-5 h-5 text-indigo-400" />;
      case "storefront-frontend":
        return <Globe className="w-5 h-5 text-emerald-400" />;
      case "cms-backend":
        return <Server className="w-5 h-5 text-purple-400" />;
      case "storefront-backend":
        return <Database className="w-5 h-5 text-sky-400" />;
      default:
        return <Rocket className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-20">
      {/* 1. TOP HEADER BANNER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-slate-100 tracking-tight">
                  OmniStore CI/CD Deployments Hub
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  4 Deploy Hooks Integrated
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Trigger and monitor deployments across CMS Frontend (Netlify), Storefront Frontend (Netlify), CMS Backend (Render) and Storefront Backend (Render).
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="relative z-10 flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleTriggerAll}
            disabled={triggeringId !== null}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {triggeringId === "all" ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>Deploy All 4 Services</span>
          </button>

          <button
            type="button"
            onClick={() => loadDeploymentData()}
            disabled={refreshing}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
            <span>Refresh</span>
          </button>

          <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <span>Auto (10s)</span>
          </label>
        </div>
      </div>

      {/* TOAST ALERT */}
      {toast && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 animate-in fade-in duration-200 shadow-xl ${toast.type === "success"
              ? "bg-emerald-950/80 border-emerald-800 text-emerald-200"
              : toast.type === "error"
                ? "bg-rose-950/80 border-rose-800 text-rose-200"
                : "bg-slate-900 border-slate-800 text-slate-200"
            }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 2. TOP KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Total Deployment Triggers</span>
            <Rocket className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-slate-100">{stats.totalTriggers ?? 0}</div>
          <p className="text-[11px] text-slate-400">Master Admin outbound dispatches</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Successful Dispatches</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {stats.successfulTriggers ?? 0}
          </div>
          <p className="text-[11px] text-emerald-400/80">
            {stats.totalTriggers && stats.totalTriggers > 0
              ? `${Math.round(((stats.successfulTriggers ?? 0) / stats.totalTriggers) * 100)}% Accepted by providers`
              : "Ready to deploy"}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Integrated Services</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">4 / 4</div>
          <p className="text-[11px] text-slate-400">2 Netlify (FO/CMS) + 2 Render (APIs)</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Netlify CI/CD Webhooks</span>
            <Radio className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400">{stats.total}</div>
          <p className="text-[11px] text-slate-400">{stats.completed} builds completed live</p>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("services")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 ${activeTab === "services"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>4 Deployment Services</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("triggers")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 ${activeTab === "triggers"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Dispatch Audit Log ({triggerLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("webhooks")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 ${activeTab === "webhooks"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Netlify Webhook Events ({webhookDeployments.length})</span>
          </button>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          Last refreshed: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* TAB 1: 4 SERVICES GRID */}
      {activeTab === "services" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => {
              const isTriggering =
                triggeringId === service.id || triggeringId === "all";
              const ping = pingResults[service.id];
              const isNetlify = service.provider === "netlify";

              return (
                <div
                  key={service.id}
                  className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all shadow-xl space-y-5 flex flex-col justify-between"
                >
                  {/* Top info row */}
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${isNetlify
                              ? "bg-indigo-950/60 border-indigo-700/60 text-indigo-400"
                              : "bg-purple-950/60 border-purple-700/60 text-purple-400"
                            }`}
                        >
                          {getServiceIcon(service.id)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-extrabold text-slate-100">
                              {service.name}
                            </h3>
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${isNetlify
                                  ? "bg-teal-950/80 text-teal-300 border-teal-800"
                                  : "bg-purple-950/80 text-purple-300 border-purple-800"
                                }`}
                            >
                              {service.provider.toUpperCase()}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                              {service.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{service.description}</p>
                        </div>
                      </div>

                      {/* Edit service modal button */}
                      <button
                        type="button"
                        onClick={() => openEditModal(service)}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 border border-slate-700 transition cursor-pointer"
                        title="Configure Hook URL or Live URL"
                      >
                        <Settings2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Hook URL box with copy button */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                        <span>Deploy Hook URL</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {service.envKey}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={service.hookUrl}
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 select-all truncate"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(service.hookUrl, `hook_${service.id}`)}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer border border-slate-700"
                        >
                          {copiedKey === `hook_${service.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedKey === `hook_${service.id}` ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Live Ping & Reachability strip */}
                    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[11px] font-bold text-slate-400 block">
                          Live Endpoint / Domain
                        </span>
                        <a
                          href={service.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-indigo-400 hover:underline flex items-center gap-1 truncate"
                        >
                          <span className="truncate">{service.liveUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 text-slate-500" />
                        </a>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {ping?.isLive !== undefined && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${ping.isLive
                                ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                                : "bg-rose-950 text-rose-300 border-rose-800"
                              }`}
                          >
                            {ping.isLive ? `200 OK (${ping.latencyMs}ms)` : "Unreachable"}
                          </span>
                        )}

                        <button
                          type="button"
                          disabled={ping?.loading}
                          onClick={() => handlePingService(service)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {ping?.loading ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                          ) : (
                            <Activity className="w-3 h-3 text-emerald-400" />
                          )}
                          <span>Ping</span>
                        </button>
                      </div>
                    </div>

                    {/* Last Trigger Status Indicator */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-400">Last Trigger Status:</span>
                      {service.lastTriggerStatus ? (
                        <span
                          className={`font-bold flex items-center gap-1.5 text-[11px] ${service.lastTriggerStatus === "SUCCESS"
                              ? "text-emerald-400"
                              : "text-rose-400"
                            }`}
                        >
                          {service.lastTriggerStatus === "SUCCESS" ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {service.lastTriggerStatus} •{" "}
                            {service.lastTriggeredAt
                              ? new Date(service.lastTriggeredAt).toLocaleTimeString()
                              : "Just now"}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Ready (No dispatches yet)</span>
                      )}
                    </div>
                  </div>

                  {/* Bottom trigger action button & cache option */}
                  <div className="pt-4 border-t border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(clearCacheOption[service.id])}
                          onChange={(e) =>
                            setClearCacheOption((prev) => ({
                              ...prev,
                              [service.id]: e.target.checked,
                            }))
                          }
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span>Clear build cache</span>
                      </label>

                      {service.lastTriggerMessage && (
                        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                          {service.lastTriggerMessage}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isTriggering}
                      onClick={() => handleTriggerDeploy(service.id)}
                      className={`w-full py-3 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 ${isNetlify
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
                          : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30"
                        }`}
                    >
                      {isTriggering ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Dispatching Deploy Hook to {service.provider}...</span>
                        </>
                      ) : (
                        <>
                          <Rocket className="w-4 h-4" />
                          <span>Trigger {service.name} Deploy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TWO COLUMN GRID: WEBHOOK INTEGRATION GUIDE & LIVE PING INSPECTOR */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
            {/* Left: Netlify Webhook Setup Instructions */}
            <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span>Incoming CI/CD Webhook Listener</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-400">Netlify & Render</span>
              </div>

              <p className="text-xs text-slate-400">
                To receive live build status updates automatically in Master Admin when builds succeed or fail on Netlify, copy this Incoming Webhook URL and paste it into Netlify Deploy Notifications:
              </p>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300">
                  Master Admin Webhook Endpoint
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getWebhookUrl()}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 font-mono text-xs text-indigo-300 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(getWebhookUrl(), "webhook_endpoint")}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copiedKey === "webhook_endpoint" ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === "webhook_endpoint" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-slate-300 block">How to configure in Netlify:</span>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
                  <li>
                    Open your Netlify site &rarr; <strong>Site configuration</strong> &rarr;{" "}
                    <strong>Build & deploy</strong>.
                  </li>
                  <li>
                    Scroll to <strong>Deploy notifications</strong> &rarr; click{" "}
                    <strong>Add notification</strong>.
                  </li>
                  <li>
                    Select <strong>Outgoing webhook</strong> & choose events:{" "}
                    <strong>Deploy started</strong>, <strong>Deploy succeeded</strong>, and{" "}
                    <strong>Deploy failed</strong>.
                  </li>
                  <li>Paste the Webhook URL above into the <strong>URL to notify</strong> input and save.</li>
                </ol>
              </div>
            </div>

            {/* Right: Custom Live URL Reachability Ping */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Verify Live Deployment Ping</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-400">Edge Ping</span>
              </div>

              <p className="text-xs text-slate-400">
                Test any deployed frontend or backend URL to verify that it is online, responding, and serving HTTP 200:
              </p>

              <div className="space-y-2">
                <input
                  type="text"
                  value={customVerifyUrl}
                  onChange={(e) => setCustomVerifyUrl(e.target.value)}
                  placeholder="https://your-site.netlify.app or https://your-backend.onrender.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs font-mono text-slate-200"
                />
                <button
                  type="button"
                  disabled={customVerifying || !customVerifyUrl}
                  onClick={handlePingCustomUrl}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {customVerifying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span>Pinging Target Server...</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ping Live URL Now</span>
                    </>
                  )}
                </button>
              </div>

              {customVerifyResult && (
                <div
                  className={`p-4 rounded-2xl border space-y-2 text-xs transition-all ${customVerifyResult.isLive
                      ? "bg-emerald-950/30 border-emerald-800/80 text-emerald-200"
                      : "bg-rose-950/30 border-rose-800/80 text-rose-200"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black flex items-center gap-1.5">
                      {customVerifyResult.isLive ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      )}
                      {customVerifyResult.isLive ? "Endpoint Reachable & Live" : "Endpoint Unreachable"}
                    </span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {customVerifyResult.statusCode
                        ? `HTTP ${customVerifyResult.statusCode}`
                        : "No response"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60">
                    <div>
                      <span className="text-slate-400 block">Latency:</span>
                      <span className="font-bold">{customVerifyResult.latencyMs}ms</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Host Header:</span>
                      <span className="font-bold truncate block">
                        {customVerifyResult.serverHeader ||
                          (customVerifyResult.isNetlify ? "Netlify Edge" : "Custom Server")}
                      </span>
                    </div>
                  </div>

                  {customVerifyResult.error && (
                    <p className="text-[11px] text-rose-400 pt-1 border-t border-rose-900/40">
                      Error: {customVerifyResult.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISPATCH AUDIT LOG */}
      {activeTab === "triggers" && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>Deployment Triggers Audit Trail ({filteredTriggerLogs.length})</span>
              </h3>
              <p className="text-xs text-slate-400">
                Log of all manual and automated deploy hooks dispatched to Netlify and Render.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchLog}
                  onChange={(e) => setSearchLog(e.target.value)}
                  placeholder="Search logs..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 placeholder-slate-500 w-52"
                />
              </div>

              {/* Service filter */}
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 cursor-pointer"
              >
                <option value="ALL">All Services</option>
                <option value="cms-frontend">CMS Frontend</option>
                <option value="storefront-frontend">Storefront Frontend</option>
                <option value="cms-backend">CMS Backend</option>
                <option value="storefront-backend">Storefront Backend</option>
              </select>

              {triggerLogs.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearTriggers}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition cursor-pointer"
                  title="Clear trigger logs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {filteredTriggerLogs.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 text-slate-500 flex items-center justify-center mx-auto">
                <Rocket className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-300">No Deployment Triggers Dispatched Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click the &quot;Trigger Deploy&quot; button on any of the 4 service cards to initiate an automated deployment.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Message</th>
                    <th className="py-3 px-4">Latency</th>
                    <th className="py-3 px-4">Dispatched At</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTriggerLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-100">{log.serviceName}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${log.provider === "netlify"
                              ? "bg-teal-950 text-teal-300 border-teal-800"
                              : "bg-purple-950 text-purple-300 border-purple-800"
                            }`}
                        >
                          {log.provider}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${log.status === "SUCCESS"
                              ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                              : "bg-rose-950 text-rose-300 border-rose-800"
                            }`}
                        >
                          {log.status === "SUCCESS" ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                          )}
                          <span>{log.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300 truncate max-w-xs">
                        {log.message}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{log.durationMs}ms</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        <span className="block font-medium">
                          {new Date(log.triggeredAt).toLocaleTimeString()}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(log.triggeredAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <Code className="w-3 h-3 text-indigo-400" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: NETLIFY WEBHOOK EVENTS */}
      {activeTab === "webhooks" && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-sky-400" />
                <span>Netlify CI/CD Webhook Audit Log ({webhookDeployments.length})</span>
              </h3>
              <p className="text-xs text-slate-400">
                Incoming notifications dispatched by Netlify when builds start, complete, or fail.
              </p>
            </div>
          </div>

          {webhookDeployments.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 text-slate-500 flex items-center justify-center mx-auto">
                <Radio className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-300">No Webhook Events Received Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Add the Master Admin Webhook Endpoint to your Netlify dashboard to automatically log build notifications.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Site Name / URL</th>
                    <th className="py-3 px-4">Deployment Status</th>
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Branch & Commit</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Received</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {webhookDeployments.map((deploy) => (
                    <tr key={deploy.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <span>{deploy.siteName}</span>
                          {deploy.url && (
                            <a
                              href={deploy.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-500 hover:text-indigo-400 transition"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono truncate block max-w-xs">
                          {deploy.url}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${deploy.isCompleted
                              ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                              : deploy.state === "building"
                                ? "bg-amber-950 text-amber-400 border-amber-800"
                                : "bg-rose-950 text-rose-400 border-rose-800"
                            }`}
                        >
                          {deploy.isCompleted ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : deploy.state === "building" ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          <span>{deploy.statusText}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {deploy.event || deploy.state}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        {deploy.branch || "main"} {deploy.commitRef ? `@${deploy.commitRef}` : ""}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {typeof deploy.deployTime === "number" ? `${deploy.deployTime}s` : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        <span className="block font-medium">
                          {new Date(deploy.receivedAt).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedWebhook(deploy)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <Code className="w-3 h-3 text-indigo-400" />
                          <span>Payload</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* EDIT SERVICE MODAL */}
      {editingService && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-100">
                    Configure {editingService.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Provider: {editingService.provider.toUpperCase()} • Env: {editingService.envKey}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-300">
                  Deploy Hook URL (Webhook Dispatch Target)
                </label>
                <textarea
                  rows={2}
                  value={editHookUrl}
                  onChange={(e) => setEditHookUrl(e.target.value)}
                  placeholder="https://api.netlify.com/build_hooks/... or https://api.render.com/deploy/..."
                  className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 font-mono text-xs text-indigo-300"
                />
                <span className="text-[10px] text-slate-500 block">
                  Default: {editingService.defaultHookUrl}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-300">
                  Live Site / Health Endpoint URL
                </label>
                <input
                  type="text"
                  value={editLiveUrl}
                  onChange={(e) => setEditLiveUrl(e.target.value)}
                  placeholder="https://your-site.netlify.app or https://your-app.onrender.com"
                  className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 font-mono text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleResetService(editingService.id)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset to Default</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={handleSaveEdit}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRIGGER LOG INSPECTOR MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span>Deployment Dispatch Details ({selectedLog.id})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Service: {selectedLog.serviceName} • Status: {selectedLog.status} (HTTP{" "}
                  {selectedLog.statusCode || "N/A"})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Dispatched URL
                </span>
                <p className="font-mono text-indigo-300 break-all">{selectedLog.hookUrl}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Provider Response Payload
              </span>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
                {typeof selectedLog.details === "string"
                  ? selectedLog.details
                  : JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WEBHOOK PAYLOAD INSPECTOR MODAL */}
      {selectedWebhook && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-sky-400" />
                  <span>Netlify Webhook Event ({selectedWebhook.id})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Site: {selectedWebhook.siteName} • State: {selectedWebhook.statusText}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWebhook(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Raw Event Payload
              </span>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(selectedWebhook.rawPayload || selectedWebhook, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedWebhook(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
