"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Activity,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Server,
  Globe,
  Radio,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Database,
  Layers,
  Layout,
  ShoppingBag,
} from "lucide-react";

interface ServiceConfig {
  id: string;
  name: string;
  category: "Frontend" | "Backend" | "Storefront" | "Landing" | "Admin" | "Custom";
  description: string;
  defaultUrl: string;
  iconName: "Layout" | "Server" | "ShoppingBag" | "Database" | "Globe" | "ShieldCheck";
  isCustom?: boolean;
}

interface PingHistoryItem {
  timestamp: string;
  latencyMs: number;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
}

interface ServiceStatus {
  status: "ONLINE" | "DEGRADED" | "OFFLINE" | "CHECKING";
  statusCode: number | null;
  statusText: string;
  latencyMs: number;
  lastChecked: string | null;
  error?: string;
  history: PingHistoryItem[];
}

const DEFAULT_SERVICES: ServiceConfig[] = [
  {
    id: "cms-frontend",
    name: "CMS Merchant Frontend",
    category: "Frontend",
    description: "Store management portal, catalog manager & analytics dashboard for merchants.",
    defaultUrl: "http://localhost:3000",
    iconName: "Layout",
  },
  {
    id: "cms-backend",
    name: "CMS Backend API",
    category: "Backend",
    description: "Core Fastify microservice handling stores, auth, database, orders & governance.",
    defaultUrl: "http://localhost:5000/healthcheck",
    iconName: "Server",
  },
  {
    id: "storefront-frontend",
    name: "Storefront Frontend",
    category: "Storefront",
    description: "Next.js multi-tenant customer storefronts with dynamic theme rendering.",
    defaultUrl: "http://localhost:3001",
    iconName: "ShoppingBag",
  },
  {
    id: "storefront-backend",
    name: "Storefront Backend API",
    category: "Storefront",
    description: "High-performance API handling cart, checkout, catalog search & payments.",
    defaultUrl: "http://localhost:5001/healthcheck",
    iconName: "Database",
  },
  {
    id: "homepage",
    name: "Homepage & Docs Site",
    category: "Landing",
    description: "Main SaaS landing site, marketing portal, documentation & developer guide.",
    defaultUrl: "http://localhost:8080",
    iconName: "Globe",
  },
  {
    id: "master-admin",
    name: "Master Admin Control Panel",
    category: "Admin",
    description: "Platform-wide master administration, tenant governance & revenue analytics.",
    defaultUrl: typeof window !== "undefined" ? window.location.origin : "http://localhost:3003",
    iconName: "ShieldCheck",
  },
];

export default function PingStatusPage() {
  const [services, setServices] = useState<ServiceConfig[]>(DEFAULT_SERVICES);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrlValue, setEditUrlValue] = useState("");
  const [statuses, setStatuses] = useState<Record<string, ServiceStatus>>({});
  const [isPingingAll, setIsPingingAll] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30); // in seconds, 0 = off
  const [secondsUntilNext, setSecondsUntilNext] = useState<number>(30);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceUrl, setNewServiceUrl] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState<ServiceConfig["category"]>("Custom");

  // Load custom services and URLs from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedUrls = localStorage.getItem("cms_ping_service_urls");
        if (savedUrls) {
          setUrls(JSON.parse(savedUrls));
        } else {
          const initial: Record<string, string> = {};
          DEFAULT_SERVICES.forEach((s) => {
            initial[s.id] = s.defaultUrl;
          });
          setUrls(initial);
        }

        const savedCustomServices = localStorage.getItem("cms_ping_custom_services");
        if (savedCustomServices) {
          const customList: ServiceConfig[] = JSON.parse(savedCustomServices);
          setServices([...DEFAULT_SERVICES, ...customList]);
        }
      } catch (err) {
        console.error("Failed to load ping configs from localStorage:", err);
      }
    }
  }, []);

  const getEffectiveUrl = (service: ServiceConfig) => {
    return urls[service.id] || service.defaultUrl;
  };

  const pingService = useCallback(async (serviceId: string, urlToPing?: string) => {
    setStatuses((prev) => ({
      ...prev,
      [serviceId]: {
        status: "CHECKING",
        statusCode: prev[serviceId]?.statusCode ?? null,
        statusText: "Pinging...",
        latencyMs: prev[serviceId]?.latencyMs ?? 0,
        lastChecked: prev[serviceId]?.lastChecked ?? null,
        history: prev[serviceId]?.history ?? [],
      },
    }));

    const targetUrl = urlToPing || urls[serviceId] || DEFAULT_SERVICES.find((s) => s.id === serviceId)?.defaultUrl;
    if (!targetUrl) return;

    try {
      const response = await fetch("/api/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const result = Array.isArray(data.results) ? data.results[0] : data;

      const newStatus: "ONLINE" | "DEGRADED" | "OFFLINE" = result.status || "OFFLINE";
      const newLatency = result.latencyMs || 0;
      const timestamp = result.timestamp || new Date().toISOString();

      setStatuses((prev) => {
        const currentHistory = prev[serviceId]?.history || [];
        const updatedHistory: PingHistoryItem[] = [
          ...currentHistory.slice(-9), // Keep last 10 records
          { timestamp, latencyMs: newLatency, status: newStatus },
        ];

        return {
          ...prev,
          [serviceId]: {
            status: newStatus,
            statusCode: result.statusCode,
            statusText: result.statusText || (newStatus === "ONLINE" ? "OK" : "Error"),
            latencyMs: newLatency,
            lastChecked: timestamp,
            error: result.error,
            history: updatedHistory,
          },
        };
      });
    } catch (err: any) {
      setStatuses((prev) => {
        const currentHistory = prev[serviceId]?.history || [];
        const timestamp = new Date().toISOString();
        const updatedHistory: PingHistoryItem[] = [
          ...currentHistory.slice(-9),
          { timestamp, latencyMs: 0, status: "OFFLINE" },
        ];

        return {
          ...prev,
          [serviceId]: {
            status: "OFFLINE",
            statusCode: null,
            statusText: "Connection Failed",
            latencyMs: 0,
            lastChecked: timestamp,
            error: err.message || "Failed to reach ping daemon",
            history: updatedHistory,
          },
        };
      });
    }
  }, [urls]);

  const pingAll = useCallback(async () => {
    setIsPingingAll(true);
    setSecondsUntilNext(autoRefreshInterval);

    try {
      const pingPromises = services.map((s) => pingService(s.id, getEffectiveUrl(s)));
      await Promise.all(pingPromises);
    } finally {
      setIsPingingAll(false);
    }
  }, [services, urls, autoRefreshInterval, pingService]);

  // Initial load ping
  useEffect(() => {
    pingAll();
  }, [services]);

  // Auto-refresh timer countdown and execution
  useEffect(() => {
    if (autoRefreshInterval === 0) return;

    setSecondsUntilNext(autoRefreshInterval);
    const interval = setInterval(() => {
      setSecondsUntilNext((prev) => {
        if (prev <= 1) {
          pingAll();
          return autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, pingAll]);

  const handleSaveUrl = (serviceId: string) => {
    if (!editUrlValue.trim()) return;
    const updated = { ...urls, [serviceId]: editUrlValue.trim() };
    setUrls(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("cms_ping_service_urls", JSON.stringify(updated));
    }
    setEditingId(null);
    pingService(serviceId, editUrlValue.trim());
  };

  const handleResetUrl = (service: ServiceConfig) => {
    const updated = { ...urls, [service.id]: service.defaultUrl };
    setUrls(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("cms_ping_service_urls", JSON.stringify(updated));
    }
    setEditingId(null);
    pingService(service.id, service.defaultUrl);
  };

  const handleAddCustomService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServiceUrl.trim()) return;

    const newId = `custom-${Date.now()}`;
    const newService: ServiceConfig = {
      id: newId,
      name: newServiceName.trim(),
      category: newServiceCategory,
      description: "Custom user-monitored host or service domain.",
      defaultUrl: newServiceUrl.trim(),
      iconName: "Globe",
      isCustom: true,
    };

    const updatedServices = [...services, newService];
    setServices(updatedServices);

    const updatedUrls = { ...urls, [newId]: newServiceUrl.trim() };
    setUrls(updatedUrls);

    if (typeof window !== "undefined") {
      const customOnly = updatedServices.filter((s) => s.isCustom);
      localStorage.setItem("cms_ping_custom_services", JSON.stringify(customOnly));
      localStorage.setItem("cms_ping_service_urls", JSON.stringify(updatedUrls));
    }

    setNewServiceName("");
    setNewServiceUrl("");
    setCustomModalOpen(false);
    pingService(newId, newServiceUrl.trim());
  };

  const handleDeleteCustomService = (serviceId: string) => {
    const updatedServices = services.filter((s) => s.id !== serviceId);
    setServices(updatedServices);

    const updatedUrls = { ...urls };
    delete updatedUrls[serviceId];
    setUrls(updatedUrls);

    const updatedStatuses = { ...statuses };
    delete updatedStatuses[serviceId];
    setStatuses(updatedStatuses);

    if (typeof window !== "undefined") {
      const customOnly = updatedServices.filter((s) => s.isCustom);
      localStorage.setItem("cms_ping_custom_services", JSON.stringify(customOnly));
      localStorage.setItem("cms_ping_service_urls", JSON.stringify(updatedUrls));
    }
  };

  // Calculations for summary metrics
  const totalCount = services.length;
  const onlineCount = services.filter((s) => statuses[s.id]?.status === "ONLINE").length;
  const degradedCount = services.filter((s) => statuses[s.id]?.status === "DEGRADED").length;
  const offlineCount = services.filter((s) => statuses[s.id]?.status === "OFFLINE").length;

  const validLatencies = services
    .map((s) => statuses[s.id]?.latencyMs)
    .filter((lat): lat is number => typeof lat === "number" && lat > 0);
  const avgLatency = validLatencies.length > 0 ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length) : 0;

  const overallSystemHealth =
    offlineCount > 0
      ? "Partial Outage"
      : degradedCount > 0
      ? "Degraded Performance"
      : totalCount > 0 && onlineCount === totalCount
      ? "All Systems Operational"
      : "Monitoring In Progress";

  const renderIcon = (iconName: ServiceConfig["iconName"]) => {
    switch (iconName) {
      case "Layout":
        return <Layout className="w-5 h-5" />;
      case "Server":
        return <Server className="w-5 h-5" />;
      case "ShoppingBag":
        return <ShoppingBag className="w-5 h-5" />;
      case "Database":
        return <Database className="w-5 h-5" />;
      case "Globe":
        return <Globe className="w-5 h-5" />;
      case "ShieldCheck":
        return <ShieldCheck className="w-5 h-5" />;
      default:
        return <Layers className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-2 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Ping Status & Health Monitor</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Real-time domain availability, round-trip latency, and heartbeat checks across all ecosystem services.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Auto Refresh Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <span className="text-slate-400 mr-2">Auto-Ping:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value={10} className="bg-slate-900 text-slate-200">Every 10s</option>
              <option value={30} className="bg-slate-900 text-slate-200">Every 30s</option>
              <option value={60} className="bg-slate-900 text-slate-200">Every 60s</option>
              <option value={0} className="bg-slate-900 text-slate-200">Manual Only</option>
            </select>
            {autoRefreshInterval > 0 && (
              <span className="ml-2 text-indigo-400 font-mono text-[11px] font-semibold">
                ({secondsUntilNext}s)
              </span>
            )}
          </div>

          {/* Add Custom Endpoint */}
          <button
            onClick={() => setCustomModalOpen(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-800 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Add Domain</span>
          </button>

          {/* Refresh All */}
          <button
            onClick={pingAll}
            disabled={isPingingAll}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isPingingAll ? "animate-spin" : ""}`} />
            <span>{isPingingAll ? "Checking All..." : "Ping All Services"}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* System Health Status */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Overall Ecosystem Status</span>
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full ${
                offlineCount > 0
                  ? "bg-rose-500 animate-ping"
                  : degradedCount > 0
                  ? "bg-amber-500 animate-pulse"
                  : "bg-emerald-500"
              }`}
            />
            <span className="text-lg font-bold text-slate-100">{overallSystemHealth}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {onlineCount} of {totalCount} monitored hosts fully responding
          </p>
        </div>

        {/* Operational Services */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Operational Domains</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{onlineCount}</span>
            <span className="text-xs text-slate-400">/ {totalCount} hosts</span>
          </div>
          <div className="mt-2 w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${totalCount ? (onlineCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Degraded / Down */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Attention Required</span>
            {offlineCount > 0 ? (
              <XCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="mt-2.5 flex items-baseline gap-3">
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${offlineCount > 0 ? "text-rose-400" : "text-slate-400"}`}>
                {offlineCount}
              </span>
              <span className="text-xs text-slate-500">down</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${degradedCount > 0 ? "text-amber-400" : "text-slate-400"}`}>
                {degradedCount}
              </span>
              <span className="text-xs text-slate-500">degraded</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {offlineCount === 0 && degradedCount === 0
              ? "All endpoints are fast and reachable"
              : "Investigate hosts reporting connection errors"}
          </p>
        </div>

        {/* Average Latency */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Average Latency</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-400">{avgLatency}</span>
            <span className="text-xs text-slate-400">ms roundtrip</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {avgLatency < 50 ? "Lightning fast response time" : avgLatency < 200 ? "Healthy response speed" : "High network latency"}
          </p>
        </div>
      </div>

      {/* Services Detailed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((service) => {
          const statusObj = statuses[service.id] || {
            status: "CHECKING",
            statusCode: null,
            statusText: "Waiting...",
            latencyMs: 0,
            lastChecked: null,
            history: [],
          };

          const currentUrl = getEffectiveUrl(service);
          const isEditing = editingId === service.id;
          const isOnline = statusObj.status === "ONLINE";
          const isDegraded = statusObj.status === "DEGRADED";
          const isOffline = statusObj.status === "OFFLINE";
          const isChecking = statusObj.status === "CHECKING";

          return (
            <div
              key={service.id}
              className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-xl ${
                isOffline
                  ? "border-rose-900/50 bg-slate-900/90 shadow-rose-950/10"
                  : isDegraded
                  ? "border-amber-900/50 bg-slate-900/90 shadow-amber-950/10"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div>
                {/* Header: Icon, Name, Category & Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl flex items-center justify-center ${
                        isOffline
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : isDegraded
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                      }`}
                    >
                      {renderIcon(service.iconName)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-base leading-tight">
                        {service.name}
                      </h3>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {service.category}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isChecking ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Pinging
                      </span>
                    ) : isOnline ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Online
                      </span>
                    ) : isDegraded ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        Degraded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/60">
                        <XCircle className="w-3 h-3 text-rose-400" />
                        Offline
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 mt-3 line-clamp-2">
                  {service.description}
                </p>

                {/* Target URL with Edit Capability */}
                <div className="mt-4 bg-slate-950 border border-slate-800/80 rounded-xl p-2.5">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editUrlValue}
                        onChange={(e) => setEditUrlValue(e.target.value)}
                        placeholder="https://your-domain.com"
                        className="w-full bg-slate-900 border border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none font-mono"
                        autoFocus
                      />
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleResetUrl(service)}
                          className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                        >
                          Reset Default
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveUrl(service.id)}
                            className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate font-mono text-xs text-slate-300 flex items-center gap-1.5">
                        <span className="text-slate-500 text-[10px]">URL:</span>
                        <a
                          href={currentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-indigo-400 transition-colors truncate"
                          title={currentUrl}
                        >
                          {currentUrl}
                        </a>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(service.id);
                            setEditUrlValue(currentUrl);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Edit Target URL"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={currentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Response Code & Latency Metrics */}
                <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">HTTP Code</span>
                    <div className="font-semibold text-slate-200 text-sm mt-0.5 flex items-center gap-1.5">
                      {statusObj.statusCode ? (
                        <span
                          className={`font-mono ${
                            statusObj.statusCode < 400 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {statusObj.statusCode} {statusObj.statusText}
                        </span>
                      ) : (
                        <span className="font-mono text-slate-500 text-xs">
                          {statusObj.statusText || "—"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Latency</span>
                    <div className="font-semibold text-slate-200 text-sm mt-0.5 flex items-center gap-1.5">
                      {statusObj.latencyMs > 0 ? (
                        <span
                          className={`font-mono ${
                            statusObj.latencyMs < 100
                              ? "text-emerald-400"
                              : statusObj.latencyMs < 300
                              ? "text-amber-400"
                              : "text-rose-400"
                          }`}
                        >
                          {statusObj.latencyMs} ms
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs font-mono">—</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error Banner if Offline */}
                {isOffline && statusObj.error && (
                  <div className="mt-3 p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/40 text-rose-300 text-xs break-words">
                    <span className="font-semibold">Reason:</span> {statusObj.error}
                  </div>
                )}

                {/* Mini Latency Bar / History */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                    <span>Recent Heartbeats</span>
                    <span>
                      {statusObj.lastChecked
                        ? new Date(statusObj.lastChecked).toLocaleTimeString()
                        : "Not checked yet"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 h-3">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const historyItem = statusObj.history[i];
                      if (!historyItem) {
                        return (
                          <div
                            key={i}
                            className="flex-1 h-2 rounded-sm bg-slate-800/60"
                            title="No record"
                          />
                        );
                      }
                      return (
                        <div
                          key={i}
                          className={`flex-1 h-2.5 rounded-sm transition-all ${
                            historyItem.status === "ONLINE"
                              ? "bg-emerald-500 hover:bg-emerald-400"
                              : historyItem.status === "DEGRADED"
                              ? "bg-amber-500 hover:bg-amber-400"
                              : "bg-rose-500 hover:bg-rose-400"
                          }`}
                          title={`${new Date(historyItem.timestamp).toLocaleTimeString()}: ${
                            historyItem.latencyMs
                          }ms (${historyItem.status})`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => pingService(service.id, currentUrl)}
                  disabled={isChecking}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`} />
                  <span>Ping Now</span>
                </button>

                {service.isCustom && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomService(service.id)}
                    className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                    title="Remove custom host"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Endpoint Modal */}
      {customModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setCustomModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 p-2.5 rounded-xl">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Add Monitored Domain</h3>
                <p className="text-xs text-slate-400">Track an extra service, microservice, or domain.</p>
              </div>
            </div>

            <form onSubmit={handleAddCustomService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Service / Domain Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Payment Microservice"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full URL / Endpoint
                </label>
                <input
                  type="url"
                  placeholder="https://api.yourstore.com/health"
                  value={newServiceUrl}
                  onChange={(e) => setNewServiceUrl(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={newServiceCategory}
                  onChange={(e) => setNewServiceCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Frontend">Frontend Application</option>
                  <option value="Backend">Backend API Service</option>
                  <option value="Storefront">Storefront Host</option>
                  <option value="Landing">Landing / Docs Site</option>
                  <option value="Custom">Custom Microservice</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCustomModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  Add & Ping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
