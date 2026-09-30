"use client";

import React, { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import {
  Store,
  Search,
  ShieldAlert,
  CheckCircle2,
  AlertOctagon,
  Trash2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Zap,
  TrendingUp,
  X,
  PlusCircle,
  History,
  Bot,
  Layers,
} from "lucide-react";

interface StoreItem {
  id: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  plan?: "FREE" | "BASIC" | "GROWING" | "ENTERPRISE";
  currency: string;
  activeTemplateSlug: string | null;
  createdAt: string;
  totalPaidAmount?: number;
  totalOrders?: number;
  aiCredits?: number;
  aiCreditsTotal?: number;
  aiCreditsUsed?: number;
  aiCreditsStorefrontUsed?: number;
  aiCreditsCmsUsed?: number;
  threeDCredits?: number;
  threeDCreditsTotal?: number;
  threeDCreditsUsed?: number;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  template?: {
    id: string;
    name: string;
  };
}

interface AiCreditsDetails {
  storeId: string;
  storeName: string;
  plan: string;
  aiCredits: number;
  aiCreditsTotal: number;
  aiCreditsUsed: number;
  aiCreditsStorefrontUsed: number;
  aiCreditsCmsUsed: number;
  threeDCredits: number;
  threeDCreditsTotal: number;
  threeDCreditsUsed: number;
  recentTransactions: Array<{
    id: string;
    action: string;
    feature: string;
    credits: number;
    balanceAfter: number;
    source: "CMS" | "STOREFRONT" | "ADMIN" | "PLAN_RENEWAL";
    description?: string;
    createdAt: string;
  }>;
}

export default function StoreManagementPage() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // AI Credits modal state
  const [selectedStoreForAi, setSelectedStoreForAi] = useState<StoreItem | null>(null);
  const [aiCreditsDetails, setAiCreditsDetails] = useState<AiCreditsDetails | null>(null);
  const [loadingAiDetails, setLoadingAiDetails] = useState(false);
  const [creditAdjustmentAmount, setCreditAdjustmentAmount] = useState<number>(100);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [modalToast, setModalToast] = useState<string | null>(null);

  const loadStores = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const data = await fetchApi<StoreItem[]>(`/api/admin/stores?${params.toString()}`);
      setStores(data);
    } catch (err: any) {
      setError(err.message || "Failed to load multi-tenant stores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStores();
  };

  const handleStatusChange = async (storeId: string, newStatus: string) => {
    setUpdatingId(storeId);
    try {
      await fetchApi(`/api/admin/stores/${storeId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      await loadStores();
    } catch (err: any) {
      alert(err.message || "Failed to update store status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePlanChange = async (storeId: string, newPlan: string) => {
    setUpdatingId(storeId);
    try {
      await fetchApi(`/api/admin/stores/${storeId}/plan`, {
        method: "PATCH",
        body: JSON.stringify({ plan: newPlan }),
      });
      await loadStores();
    } catch (err: any) {
      alert(err.message || "Failed to update store plan.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteStore = async (storeId: string, storeName: string) => {
    if (
      !confirm(
        `CAUTION: Are you sure you want to PERMANENTLY delete store "${storeName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await fetchApi(`/api/admin/stores/${storeId}`, {
        method: "DELETE",
      });
      await loadStores();
    } catch (err: any) {
      alert(err.message || "Failed to delete store.");
    }
  };

  const openAiCreditsModal = async (store: StoreItem) => {
    setSelectedStoreForAi(store);
    setLoadingAiDetails(true);
    setModalToast(null);
    setCreditAdjustmentAmount(100);
    setAdjustmentReason("");
    try {
      const data = await fetchApi<AiCreditsDetails>(`/api/admin/stores/${store.id}/ai-credits`);
      setAiCreditsDetails(data);
    } catch (err: any) {
      setModalToast("Failed to fetch store AI credit stats: " + err.message);
    } finally {
      setLoadingAiDetails(false);
    }
  };

  const handleAdjustCredits = async () => {
    if (!selectedStoreForAi) return;
    if (creditAdjustmentAmount === 0) {
      setModalToast("Adjustment amount cannot be zero.");
      return;
    }

    setAdjusting(true);
    setModalToast(null);
    try {
      const res = await fetchApi<any>(`/api/admin/stores/${selectedStoreForAi.id}/ai-credits/adjust`, {
        method: "POST",
        body: JSON.stringify({
          amount: Number(creditAdjustmentAmount),
          reason: adjustmentReason || "Master Admin Manual Adjustment",
        }),
      });

      setModalToast(`Successfully updated AI credits! New balance: ${res.newBalance}`);
      // Refresh modal details and main list
      const updatedDetails = await fetchApi<AiCreditsDetails>(
        `/api/admin/stores/${selectedStoreForAi.id}/ai-credits`
      );
      setAiCreditsDetails(updatedDetails);
      loadStores();
    } catch (err: any) {
      setModalToast("Error adjusting credits: " + err.message);
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <span>Global Stores Governance</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              AI Powered
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor all merchant stores, enforce compliance, inspect AI credit usage across Storefront and CMS, and override quotas.
          </p>
        </div>
        <button
          onClick={loadStores}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium border border-slate-800 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Reload Stores</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search store name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      {/* Stores Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 uppercase text-xs text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-6 whitespace-nowrap">Store Name / Slug</th>
                <th className="py-4 px-6 whitespace-nowrap">Merchant Owner</th>
                <th className="py-4 px-6 whitespace-nowrap">Subscription Plan</th>
                <th className="py-4 px-6 whitespace-nowrap min-w-[220px]">AI Credits & Usage</th>
                <th className="py-4 px-6 whitespace-nowrap">Store Revenue / Sales</th>
                <th className="py-4 px-6 whitespace-nowrap">Theme / Currency</th>
                <th className="py-4 px-6 whitespace-nowrap">Status</th>
                <th className="py-4 px-6 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {stores.map((store) => {
                const totalCred = store.aiCreditsTotal ?? 100;
                const remainingCred = store.aiCredits ?? 100;
                const usedCred = store.aiCreditsUsed ?? 0;
                const sfUsed = store.aiCreditsStorefrontUsed ?? 0;
                const cmsUsed = store.aiCreditsCmsUsed ?? 0;
                const percentUsed = totalCred > 0 ? Math.min(100, Math.round((usedCred / totalCred) * 100)) : 0;

                return (
                  <tr key={store.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="font-semibold text-slate-100">{store.name}</div>
                      <div className="text-xs text-indigo-400 font-mono">/{store.slug}</div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="font-medium text-slate-200">{store.owner.name}</div>
                      <div className="text-xs text-slate-400">{store.owner.email}</div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <select
                        value={store.plan || "FREE"}
                        onChange={(e) => handlePlanChange(store.id, e.target.value)}
                        disabled={updatingId === store.id}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border bg-slate-950 cursor-pointer focus:outline-none ${
                          (store.plan || "FREE") === "FREE"
                            ? "text-slate-300 border-slate-700"
                            : (store.plan || "FREE") === "BASIC"
                            ? "text-indigo-300 border-indigo-700 bg-indigo-950/60"
                            : (store.plan || "FREE") === "GROWING"
                            ? "text-emerald-300 border-emerald-700 bg-emerald-950/60"
                            : "text-purple-300 border-purple-700 bg-purple-950/60"
                        }`}
                      >
                        <option value="FREE">FREE (100 AI Credits)</option>
                        <option value="BASIC">BASIC (500 AI Credits)</option>
                        <option value="GROWING">GROWING (2,500 AI Credits)</option>
                        <option value="ENTERPRISE">ENTERPRISE (10,000 AI Credits)</option>
                      </select>
                    </td>

                    {/* AI Credits & Quota Column */}
                    <td className="py-4 px-6 whitespace-nowrap min-w-[220px]">
                      <div
                        onClick={() => openAiCreditsModal(store)}
                        className="cursor-pointer group p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800/90 hover:border-indigo-500/50 transition-all w-full max-w-[230px]"
                        title="Click to view full AI usage breakdown and manage credits"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1 group-hover:text-indigo-300">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>{remainingCred.toLocaleString()}</span>
                            <span className="text-slate-500 font-normal text-[11px]">/ {totalCred.toLocaleString()}</span>
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800/80 shrink-0">
                            {usedCred} used
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden mb-1.5">
                          <div
                            className={`h-full transition-all ${
                              percentUsed > 90
                                ? "bg-rose-500"
                                : percentUsed > 70
                                ? "bg-amber-500"
                                : "bg-indigo-500"
                            }`}
                            style={{ width: `${percentUsed}%` }}
                          />
                        </div>

                        {/* Storefront vs CMS Breakdown Badges */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <Bot className="w-3 h-3 shrink-0" />
                            <span>SF: {sfUsed}</span>
                          </span>
                          <span className="flex items-center gap-1 text-purple-400 font-medium">
                            <Layers className="w-3 h-3 shrink-0" />
                            <span>CMS: {cmsUsed}</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="font-bold text-emerald-400">
                        ${(store.totalPaidAmount || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {store.currency || "USD"}
                      </div>
                      <div className="text-xs text-slate-400">{store.totalOrders || 0} Orders</div>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-xs text-slate-300 font-medium">
                        {store.template?.name || store.activeTemplateSlug || "Default Theme"}
                      </div>
                      <div className="text-xs text-slate-500 uppercase">{store.currency}</div>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          store.status === "ACTIVE"
                            ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                            : store.status === "SUSPENDED"
                            ? "bg-rose-950/80 text-rose-300 border border-rose-800/60"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {store.status === "ACTIVE" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {store.status === "SUSPENDED" && <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />}
                        {store.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openAiCreditsModal(store)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 hover:text-white text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                        title="Manage AI Credits"
                      >
                        <Zap className="w-3.5 h-3.5 text-indigo-400" />
                        <span>AI Quota</span>
                      </button>

                      {store.status === "SUSPENDED" ? (
                        <button
                          onClick={() => handleStatusChange(store.id, "ACTIVE")}
                          disabled={updatingId === store.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 hover:bg-emerald-800 hover:text-white text-xs font-medium transition-all cursor-pointer"
                        >
                          Unsuspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(store.id, "SUSPENDED")}
                          disabled={updatingId === store.id}
                          className="px-3 py-1.5 rounded-lg bg-amber-950 border border-amber-800 text-amber-300 hover:bg-amber-800 hover:text-white text-xs font-medium transition-all cursor-pointer"
                        >
                          Suspend
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteStore(store.id, store.name)}
                        className="p-1.5 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-400 hover:bg-rose-900 hover:text-white transition-all cursor-pointer inline-flex items-center"
                        title="Delete Store"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && stores.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500 text-sm">
                    No stores found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Credits & Intelligence Quota Detail Modal */}
      {selectedStoreForAi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <span>AI Credits Intelligence</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                      {selectedStoreForAi.name}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Store ID: {selectedStoreForAi.id} • Slug: /{selectedStoreForAi.slug}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStoreForAi(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalToast && (
              <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-xs text-indigo-200">
                {modalToast}
              </div>
            )}

            {loadingAiDetails ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                <span className="text-xs">Loading store AI credits and telemetry logs...</span>
              </div>
            ) : aiCreditsDetails ? (
              <div className="space-y-6">
                {/* Credit Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Available Balance
                    </span>
                    <span className="text-2xl font-black text-indigo-300 mt-1 block">
                      {aiCreditsDetails.aiCredits.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500">Ready to spend</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Allocated Quota
                    </span>
                    <span className="text-2xl font-black text-slate-200 mt-1 block">
                      {aiCreditsDetails.aiCreditsTotal.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500">Plan: {aiCreditsDetails.plan}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-900/30">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5" />
                      <span>Storefront AI</span>
                    </span>
                    <span className="text-2xl font-black text-emerald-300 mt-1 block">
                      {aiCreditsDetails.aiCreditsStorefrontUsed.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500">Chatbot, Search, Recs</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-purple-900/30">
                    <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      <span>CMS Studio AI</span>
                    </span>
                    <span className="text-2xl font-black text-purple-300 mt-1 block">
                      {aiCreditsDetails.aiCreditsCmsUsed.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500">Generator, Copilot, 3D</span>
                  </div>
                </div>

                {/* Adjust Credits Box */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 border border-indigo-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                      <PlusCircle className="w-4 h-4" />
                      <span>Master Admin AI Credit Adjustment</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">Positive to grant, negative to deduct</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Adjustment Amount (Credits)
                      </label>
                      <input
                        type="number"
                        value={creditAdjustmentAmount}
                        onChange={(e) => setCreditAdjustmentAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-bold focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. 500 or -100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Reason / Note for Merchant Audit
                      </label>
                      <input
                        type="text"
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. Complimentary bonus for campaign"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleAdjustCredits}
                      disabled={adjusting || creditAdjustmentAmount === 0}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
                    >
                      {adjusting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      <span>Apply Credit Adjustment</span>
                    </button>
                  </div>
                </div>

                {/* Audit & Transaction History */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <History className="w-4 h-4" />
                    <span>Recent AI Credit Transactions & Telemetry</span>
                  </h4>

                  {aiCreditsDetails.recentTransactions.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500 text-center">
                      No AI feature activity recorded yet for this store.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-800 overflow-hidden">
                      <div className="max-h-52 overflow-y-auto divide-y divide-slate-800/80">
                        {aiCreditsDetails.recentTransactions.map((tx) => (
                          <div key={tx.id} className="p-3 bg-slate-950/70 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    tx.source === "STOREFRONT"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : tx.source === "CMS"
                                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                      : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                  }`}
                                >
                                  {tx.source}
                                </span>
                                <span>{tx.feature || tx.action}</span>
                              </div>
                              {tx.description && (
                                <div className="text-[11px] text-slate-400 mt-0.5">{tx.description}</div>
                              )}
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {new Date(tx.createdAt).toLocaleString()}
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`font-bold ${
                                  tx.credits > 0
                                    ? "text-rose-400"
                                    : "text-emerald-400"
                                }`}
                              >
                                {tx.credits > 0 ? `-${tx.credits}` : `+${Math.abs(tx.credits)}`} credits
                              </span>
                              <div className="text-[10px] text-slate-500">
                                Bal: {tx.balanceAfter}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
