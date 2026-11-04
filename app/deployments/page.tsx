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
  Filter,
  Trash2,
  Globe,
  GitBranch,
  Terminal,
  Zap,
  Info,
  ShieldAlert,
  Code,
  Radio,
  SlidersHorizontal,
  ChevronDown,
  X,
} from "lucide-react";
import { NetlifyDeployment, DeploymentStats } from "@/lib/deploymentsStore";

export default function NetlifyDeploymentsPage() {
  const [deployments, setDeployments] = useState<NetlifyDeployment[]>([]);
  const [stats, setStats] = useState<DeploymentStats>({
    total: 0,
    completed: 0,
    building: 0,
    failed: 0,
    averageDeployTimeSeconds: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Webhook copy state
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Selected deployment for JSON inspection modal
  const [selectedDeploy, setSelectedDeploy] = useState<NetlifyDeployment | null>(null);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);

  // Live URL verifier state
  const [verifyUrl, setVerifyUrl] = useState("https://serene-croissant-868f08.netlify.app");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    isLive: boolean;
    statusCode: number | null;
    latencyMs: number;
    isNetlify: boolean;
    serverHeader?: string;
    error?: string;
  } | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getWebhookUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api/webhooks/netlify`;
    }
    return "/api/webhooks/netlify";
  };

  const loadDeployments = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await fetch("/api/webhooks/netlify", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setDeployments(data.deployments || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err: any) {
      console.error("Failed to load Netlify deployments:", err);
      if (!isSilent) showToast("Failed to fetch deployments from server.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDeployments();
  }, [loadDeployments]);

  // Auto-refresh polling every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadDeployments(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadDeployments]);

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(getWebhookUrl());
    setCopiedWebhook(true);
    showToast("Webhook URL copied to clipboard!");
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const handleSimulateWebhook = async (statusType: "ready" | "building" | "error") => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/webhooks/netlify", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: "omnistore-storefront",
          statusType,
          branch: "main",
          title: statusType === "ready"
            ? "Release: Production theme update & checkout optimizations"
            : statusType === "building"
            ? "Build #1042: Compiling Next.js assets"
            : "Failed build: TS2345 type mismatch in cart provider",
          url: "https://serene-croissant-868f08.netlify.app",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(
          statusType === "ready"
            ? "✨ Simulated 'Deploy Succeeded' webhook received!"
            : statusType === "building"
            ? "⏳ Simulated 'Deploy Building' webhook received!"
            : "⚠️ Simulated 'Deploy Failed' webhook received!",
          statusType === "error" ? "error" : "success"
        );
        loadDeployments(true);
      }
    } catch (err: any) {
      showToast("Simulation failed: " + err.message, "error");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleVerifyLiveSite = async () => {
    if (!verifyUrl) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch(`/api/webhooks/netlify?action=verify&verifyUrl=${encodeURIComponent(verifyUrl)}`);
      if (res.ok) {
        const data = await res.json();
        setVerifyResult({
          isLive: data.isLive,
          statusCode: data.statusCode,
          latencyMs: data.latencyMs,
          isNetlify: data.isNetlify,
          serverHeader: data.serverHeader,
          error: data.error,
        });
      }
    } catch (err: any) {
      setVerifyResult({
        isLive: false,
        statusCode: null,
        latencyMs: 0,
        isNetlify: false,
        error: err.message,
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm("Are you sure you want to clear all recorded deployment logs?")) return;
    try {
      const res = await fetch("/api/webhooks/netlify", { method: "DELETE" });
      if (res.ok) {
        showToast("Deployment history cleared.");
        loadDeployments();
      }
    } catch (err: any) {
      showToast("Failed to clear logs.", "error");
    }
  };

  // Filter deployments
  const filteredDeployments = deployments.filter((d) => {
    const matchesSearch =
      d.siteName.toLowerCase().includes(search.toLowerCase()) ||
      d.url.toLowerCase().includes(search.toLowerCase()) ||
      (d.branch && d.branch.toLowerCase().includes(search.toLowerCase())) ||
      (d.title && d.title.toLowerCase().includes(search.toLowerCase())) ||
      (d.commitRef && d.commitRef.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "COMPLETED" && d.isCompleted) ||
      (statusFilter === "BUILDING" && (d.state === "building" || d.state === "enqueued")) ||
      (statusFilter === "FAILED" && d.state === "error");

    return matchesSearch && matchesStatus;
  });

  const latestDeploy = stats.latestDeploy || deployments[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-100">Netlify Deployment Monitor</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Webhook Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time Netlify CI/CD build tracker, deployment completion verification & webhook listener.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => loadDeployments()}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
            <span>Refresh</span>
          </button>

          <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <span>Auto-poll (10s)</span>
          </label>

          {/* Quick Simulation Menu */}
          <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-0.5">
            <button
              type="button"
              disabled={isSimulating}
              onClick={() => handleSimulateWebhook("ready")}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-emerald-300 hover:bg-emerald-950/60 transition cursor-pointer"
              title="Simulate Deploy Succeeded event"
            >
              + Success
            </button>
            <button
              type="button"
              disabled={isSimulating}
              onClick={() => handleSimulateWebhook("building")}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-amber-300 hover:bg-amber-950/60 transition cursor-pointer"
              title="Simulate Deploy Building event"
            >
              + Building
            </button>
            <button
              type="button"
              disabled={isSimulating}
              onClick={() => handleSimulateWebhook("error")}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-rose-300 hover:bg-rose-950/60 transition cursor-pointer"
              title="Simulate Deploy Failed event"
            >
              + Fail
            </button>
          </div>
        </div>
      </div>

      {/* TOAST ALERT */}
      {toast && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 animate-in fade-in duration-200 shadow-md ${
            toast.type === "success"
              ? "bg-emerald-950/70 border-emerald-800 text-emerald-200"
              : toast.type === "error"
              ? "bg-rose-950/70 border-rose-800 text-rose-200"
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

      {/* LATEST DEPLOY HIGHLIGHT BANNER */}
      {latestDeploy && (
        <div
          className={`p-5 rounded-3xl border transition-all ${
            latestDeploy.isCompleted
              ? "bg-emerald-950/20 border-emerald-800/60 text-emerald-200"
              : latestDeploy.state === "building"
              ? "bg-amber-950/20 border-amber-800/60 text-amber-200"
              : "bg-rose-950/20 border-rose-800/60 text-rose-200"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                  latestDeploy.isCompleted
                    ? "bg-emerald-900/30 border-emerald-700/50 text-emerald-400"
                    : latestDeploy.state === "building"
                    ? "bg-amber-900/30 border-amber-700/50 text-amber-400 animate-pulse"
                    : "bg-rose-900/30 border-rose-700/50 text-rose-400"
                }`}
              >
                {latestDeploy.isCompleted ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : latestDeploy.state === "building" ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider">
                    {latestDeploy.isCompleted
                      ? "Latest Deployment: Completed & Live"
                      : latestDeploy.state === "building"
                      ? "Latest Deployment: Building in Progress..."
                      : "Latest Deployment: Build Failed"}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 font-mono">
                    {latestDeploy.siteName}
                  </span>
                  {latestDeploy.branch && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 font-mono flex items-center gap-1">
                      <GitBranch className="w-3 h-3 text-indigo-400" />
                      {latestDeploy.branch}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300">
                  {latestDeploy.title || "Production commit deploy"}
                  {latestDeploy.deployTime ? ` • Built in ${latestDeploy.deployTime}s` : ""}
                  {" • "}
                  <span className="text-slate-400">
                    Received {new Date(latestDeploy.receivedAt).toLocaleTimeString()}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {latestDeploy.url && (
                <a
                  href={latestDeploy.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Visit Live Site</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4 TOP KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Deploys */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Total Webhook Deploys</span>
            <Radio className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-slate-100">{stats.total}</div>
          <p className="text-[11px] text-slate-400">Recorded across all sites</p>
        </div>

        {/* Completed */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Completed (Succeeded)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{stats.completed}</div>
          <p className="text-[11px] text-emerald-400/80">
            {stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}% Success rate` : "No builds yet"}
          </p>
        </div>

        {/* Building */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>In-Progress / Building</span>
            <RefreshCw className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{stats.building}</div>
          <p className="text-[11px] text-slate-400">Currently running in CI/CD</p>
        </div>

        {/* Failed */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Failed Builds</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{stats.failed}</div>
          <p className="text-[11px] text-slate-400">
            Avg build duration: {stats.averageDeployTimeSeconds}s
          </p>
        </div>
      </div>

      {/* TWO COLUMN GRID: WEBHOOK CONFIG & LIVE REACHABILITY VERIFIER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Webhook Configuration Guide */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>Netlify Webhook Integration Setup</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Step-by-step setup</span>
          </div>

          <p className="text-xs text-slate-400">
            To automatically receive deploy status notifications whenever a Netlify build starts, succeeds, or fails, add this Outgoing Webhook URL to your Netlify dashboard:
          </p>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-300">
              Master Admin Webhook Endpoint URL
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
                onClick={handleCopyWebhookUrl}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWebhook ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-slate-300 block">How to configure in Netlify:</span>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
              <li>Open your Netlify site &rarr; <strong>Site configuration</strong> &rarr; <strong>Build & deploy</strong>.</li>
              <li>Scroll down to <strong>Deploy notifications</strong> &rarr; click <strong>Add notification</strong>.</li>
              <li>Select <strong>Outgoing webhook</strong> from the notification options.</li>
              <li>Select events: <strong>Deploy succeeded</strong>, <strong>Deploy failed</strong>, and <strong>Deploy started</strong>.</li>
              <li>Paste the Webhook URL above into the <strong>URL to notify</strong> input and save!</li>
            </ol>
          </div>
        </div>

        {/* Right (5 cols): Live Netlify Site Ping Verifier */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Verify Live Deployment</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Edge Ping</span>
          </div>

          <p className="text-xs text-slate-400">
            Directly test any Netlify storefront or custom domain URL to check if the deployed build is online, responsive, and serving HTTP 200:
          </p>

          <div className="space-y-2">
            <input
              type="text"
              value={verifyUrl}
              onChange={(e) => setVerifyUrl(e.target.value)}
              placeholder="https://your-site.netlify.app"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs font-mono text-slate-200"
            />
            <button
              type="button"
              disabled={verifying || !verifyUrl}
              onClick={handleVerifyLiveSite}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Pinging Netlify Edge...</span>
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Check Deployment Status Now</span>
                </>
              )}
            </button>
          </div>

          {verifyResult && (
            <div
              className={`p-4 rounded-2xl border space-y-2 text-xs transition-all ${
                verifyResult.isLive
                  ? "bg-emerald-950/30 border-emerald-800/80 text-emerald-200"
                  : "bg-rose-950/30 border-rose-800/80 text-rose-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black flex items-center gap-1.5">
                  {verifyResult.isLive ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  {verifyResult.isLive ? "Deployment is LIVE & Reachable" : "Deployment Unreachable"}
                </span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  {verifyResult.statusCode ? `HTTP ${verifyResult.statusCode}` : "No response"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60">
                <div>
                  <span className="text-slate-400 block">Latency:</span>
                  <span className="font-bold">{verifyResult.latencyMs}ms</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Netlify Edge:</span>
                  <span className="font-bold">
                    {verifyResult.isNetlify ? "Verified Netlify Host" : "Custom Server / Proxy"}
                  </span>
                </div>
              </div>

              {verifyResult.error && (
                <p className="text-[11px] text-rose-400 pt-1 border-t border-rose-900/40">
                  Error: {verifyResult.error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* DEPLOYMENTS AUDIT TABLE */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        {/* Table Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>Netlify Webhook Deployments Audit Log ({filteredDeployments.length})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Audit trail of deploy notifications received via the Netlify webhook endpoint.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search site, branch, commit..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 placeholder-slate-500 w-56"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed (Live)</option>
              <option value="BUILDING">Building / Enqueued</option>
              <option value="FAILED">Failed</option>
            </select>

            {deployments.length > 0 && (
              <button
                type="button"
                onClick={handleClearLogs}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition cursor-pointer"
                title="Clear deployment logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Deployments List */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
            <span>Loading Netlify deployments...</span>
          </div>
        ) : filteredDeployments.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 text-slate-500 flex items-center justify-center mx-auto">
              <Rocket className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-300">No Netlify Webhook Events Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Trigger a git push on your storefront repository or use the &quot;+ Success&quot; simulation buttons above to test the webhook listener.
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
                {filteredDeployments.map((deploy) => {
                  return (
                    <tr key={deploy.id} className="hover:bg-slate-800/30 transition">
                      {/* Site Name & Link */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <span>{deploy.siteName}</span>
                          {deploy.url && (
                            <a
                              href={deploy.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-500 hover:text-indigo-400 transition"
                              title="Open live URL"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono truncate block max-w-xs">
                          {deploy.url}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {deploy.isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-extrabold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Completed</span>
                          </span>
                        ) : deploy.state === "building" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-[11px] font-extrabold">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Building</span>
                          </span>
                        ) : deploy.state === "enqueued" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-950 text-sky-400 border border-sky-800 text-[11px] font-extrabold">
                            <Clock className="w-3 h-3" />
                            <span>Enqueued</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-950 text-rose-400 border border-rose-800 text-[11px] font-extrabold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>

                      {/* Event */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {deploy.event || deploy.state}
                        </span>
                      </td>

                      {/* Branch & Commit */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-mono text-slate-300 text-[11px]">
                          <GitBranch className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>{deploy.branch || "main"}</span>
                          {deploy.commitRef && (
                            <span className="text-slate-500">@{deploy.commitRef}</span>
                          )}
                        </div>
                        {deploy.title && (
                          <span className="text-[11px] text-slate-400 line-clamp-1 max-w-xs block">
                            {deploy.title}
                          </span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {typeof deploy.deployTime === "number" ? `${deploy.deployTime}s` : "—"}
                      </td>

                      {/* Received Time */}
                      <td className="py-3.5 px-4 text-slate-400">
                        <span className="block font-medium">
                          {new Date(deploy.receivedAt).toLocaleTimeString()}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(deploy.receivedAt).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedDeploy(deploy)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <Code className="w-3 h-3 text-indigo-400" />
                          <span>Payload</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RAW PAYLOAD INSPECTOR MODAL */}
      {selectedDeploy && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span>Deployment Event Details ({selectedDeploy.id})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Site: {selectedDeploy.siteName} • State: {selectedDeploy.statusText}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDeploy(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedDeploy.errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Build Error Message:
                </span>
                <p className="font-mono text-[11px] whitespace-pre-wrap">{selectedDeploy.errorMessage}</p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Raw Netlify Webhook Payload
              </span>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                {JSON.stringify(selectedDeploy.rawPayload || selectedDeploy, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedDeploy(null)}
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
