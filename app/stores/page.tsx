"use client";

import React, { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Store, Search, ShieldAlert, CheckCircle2, AlertOctagon, Trash2, ExternalLink, RefreshCw } from "lucide-react";

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

export default function StoreManagementPage() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    if (!confirm(`CAUTION: Are you sure you want to PERMANENTLY delete store "${storeName}"? This action cannot be undone.`)) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Global Stores Governance</h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor all merchant stores across the multi-tenant CMS ecosystem, enforce compliance, and override statuses.
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
                <th className="py-4 px-6">Store Name / Slug</th>
                <th className="py-4 px-6">Merchant Owner</th>
                <th className="py-4 px-6">Subscription Plan</th>
                <th className="py-4 px-6">Store Revenue / Sales</th>
                <th className="py-4 px-6">Theme / Currency</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Created At</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-slate-100">{store.name}</div>
                    <div className="text-xs text-indigo-400 font-mono">/{store.slug}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-200">{store.owner.name}</div>
                    <div className="text-xs text-slate-400">{store.owner.email}</div>
                  </td>
                  <td className="py-4 px-6">
                    <select
                      value={store.plan || "FREE"}
                      onChange={(e) => handlePlanChange(store.id, e.target.value)}
                      disabled={updatingId === store.id}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border bg-slate-950 cursor-pointer focus:outline-none ${
                        (store.plan || "FREE") === "FREE"
                          ? "text-slate-300 border-slate-700"
                          : (store.plan || "FREE") === "BASIC"
                          ? "text-indigo-300 border-indigo-700 bg-indigo-950/60"
                          : (store.plan || "FREE") === "GROWING"
                          ? "text-emerald-300 border-emerald-700 bg-emerald-950/60"
                          : "text-purple-300 border-purple-700 bg-purple-950/60"
                      }`}
                    >
                      <option value="FREE">FREE (10 Products Limit)</option>
                      <option value="BASIC">BASIC (500 Products Limit)</option>
                      <option value="GROWING">GROWING (Unlimited Products)</option>
                      <option value="ENTERPRISE">LARGE ENTERPRISE (Custom SLA)</option>
                    </select>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-bold text-emerald-400">
                      ${(store.totalPaidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {store.currency || "USD"}
                    </div>
                    <div className="text-xs text-slate-400">{store.totalOrders || 0} Orders</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-xs text-slate-300 font-medium">{store.template?.name || store.activeTemplateSlug || "Default Theme"}</div>
                    <div className="text-xs text-slate-500 uppercase">{store.currency}</div>
                  </td>
                  <td className="py-4 px-6">
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
                  <td className="py-4 px-6 text-xs text-slate-400">
                    {new Date(store.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
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
              ))}
              {!loading && stores.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 text-sm">
                    No stores found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
