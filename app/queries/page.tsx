"use client";

import React, { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import {
  HelpCircle,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Store,
  Mail,
  User,
  ShieldAlert,
  ArrowUpRight,
  Send,
  Eye,
  Check,
  Ban,
  Unlock,
  AlertCircle,
  Tag,
  FileText,
} from "lucide-react";

interface SupportQuery {
  id: string;
  ticketNumber: string;
  storeId?: string | null;
  storeName?: string | null;
  storeSlug?: string | null;
  userEmail: string;
  userName?: string | null;
  type: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  adminNotes?: string | null;
  resolutionMsg?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  store?: {
    id: string;
    name: string;
    slug: string;
    status: string;
    currency: string;
    plan: string;
  } | null;
}

export default function SupportQueriesPage() {
  const [queries, setQueries] = useState<SupportQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inReview: 0,
    resolved: 0,
    rejected: 0,
  });

  // Active Inspector Modal
  const [selectedQuery, setSelectedQuery] = useState<SupportQuery | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [resolutionMsg, setResolutionMsg] = useState("");
  const [targetStatus, setTargetStatus] = useState("IN_REVIEW");
  const [autoUnsuspend, setAutoUnsuspend] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadQueries = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (typeFilter !== "ALL") params.append("type", typeFilter);
      if (priorityFilter !== "ALL") params.append("priority", priorityFilter);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetchApi(`/api/support/admin/queries?${params.toString()}`);
      if (res && res.success) {
        setQueries(res.data || []);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.error("Failed to load support queries:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueries();
  }, [statusFilter, typeFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadQueries();
  };

  const openInspector = (query: SupportQuery) => {
    setSelectedQuery(query);
    setTargetStatus(query.status === "PENDING" ? "IN_REVIEW" : query.status);
    setAdminNotes(query.adminNotes || "");
    setResolutionMsg(query.resolutionMsg || "");
    setAutoUnsuspend(query.store?.status === "SUSPENDED");
    setFeedbackMessage(null);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuery) return;

    setIsUpdating(true);
    setFeedbackMessage(null);

    try {
      const res = await fetchApi(`/api/support/admin/queries/${selectedQuery.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: targetStatus,
          adminNotes,
          resolutionMsg,
          unSuspendStore: autoUnsuspend && targetStatus === "RESOLVED",
        }),
      });

      if (res && res.success) {
        setFeedbackMessage({
          type: "success",
          text: autoUnsuspend && targetStatus === "RESOLVED"
            ? "Appeal resolved and store un-suspended successfully!"
            : "Query status updated successfully.",
        });
        await loadQueries();
        setSelectedQuery(res.data);
      } else {
        setFeedbackMessage({ type: "error", text: res?.message || "Failed to update query." });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err.message || "Failed to update status." });
    } finally {
      setIsUpdating(false);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p?.toUpperCase()) {
      case "URGENT":
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase">URGENT</span>;
      case "HIGH":
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase">HIGH</span>;
      case "NORMAL":
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-black uppercase">NORMAL</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/40 text-[10px] font-black uppercase">LOW</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s?.toUpperCase()) {
      case "PENDING":
        return <span className="px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-600/50 text-[11px] font-black flex items-center gap-1"><Clock className="w-3 h-3" /> PENDING</span>;
      case "IN_REVIEW":
        return <span className="px-2.5 py-1 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-600/50 text-[11px] font-black flex items-center gap-1"><Eye className="w-3 h-3" /> IN REVIEW</span>;
      case "RESOLVED":
        return <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 text-[11px] font-black flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> RESOLVED</span>;
      case "REJECTED":
        return <span className="px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-600/50 text-[11px] font-black flex items-center gap-1"><XCircle className="w-3 h-3" /> REJECTED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[11px] font-black">{s}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2.5">
              <HelpCircle className="w-7 h-7 text-indigo-400" />
              <span>Appeals & Inquiries</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Review incoming store reinstatement appeals, compliance inquiries, and merchant support tickets.
            </p>
          </div>

          <button
            onClick={loadQueries}
            disabled={isLoading}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Feed</span>
          </button>
        </div>

        {/* KPI Metrics Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Inquiries</span>
            <div className="text-2xl font-black text-slate-100">{stats.total}</div>
            <span className="text-[10px] text-slate-500">All recorded tickets</span>
          </div>

          <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Pending Review
            </span>
            <div className="text-2xl font-black text-amber-300">{stats.pending}</div>
            <span className="text-[10px] text-amber-500/80">Requires admin action</span>
          </div>

          <div className="bg-indigo-950/20 border border-indigo-800/40 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Under Investigation</span>
            <div className="text-2xl font-black text-indigo-300">{stats.inReview}</div>
            <span className="text-[10px] text-indigo-500/80">Active discussions</span>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Resolved</span>
            <div className="text-2xl font-black text-emerald-300">{stats.resolved}</div>
            <span className="text-[10px] text-emerald-500/80">Successfully processed</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Ticket ID, Store Name, Merchant Email, or Keywords..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </form>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Action</option>
              <option value="IN_REVIEW">Under Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Category Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full md:w-auto px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Categories</option>
              <option value="APPEAL">Store Suspension Appeals</option>
              <option value="COMPLIANCE">Compliance & Legal</option>
              <option value="TECHNICAL">Technical Bugs</option>
              <option value="BILLING">Billing Issues</option>
              <option value="GENERAL">General Support</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full md:w-auto px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="NORMAL">Normal Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Support Queries List / Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
              <span className="text-xs font-semibold">Loading inquiries feed...</span>
            </div>
          ) : queries.length === 0 ? (
            <div className="text-center py-20 px-4 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">No Inquiries Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No tickets match your filter criteria or there are currently no pending merchant appeals.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {queries.map((q) => (
                <div
                  key={q.id}
                  onClick={() => openInspector(q)}
                  className="p-4 sm:p-5 hover:bg-slate-800/50 transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                        {q.ticketNumber}
                      </span>
                      {getPriorityBadge(q.priority)}
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold">
                        {q.type}
                      </span>
                      {getStatusBadge(q.status)}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-100 hover:text-indigo-300 transition-colors">
                        {q.subject}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {q.message}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <Store className="w-3.5 h-3.5 text-indigo-400" />
                        {q.storeName || "Store"} ({q.storeSlug || "store"})
                        {q.store?.status === "SUSPENDED" && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 text-[9px] font-bold border border-rose-800">
                            SUSPENDED
                          </span>
                        )}
                      </span>

                      <span className="flex items-center gap-1 text-slate-400">
                        <Mail className="w-3.5 h-3.5" />
                        {q.userEmail}
                      </span>

                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(q.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInspector(q);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Appeal</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Appeal Review & Action Inspector Modal */}
        {selectedQuery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full text-slate-100 space-y-5 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {selectedQuery.ticketNumber}
                    </span>
                    {getPriorityBadge(selectedQuery.priority)}
                    {getStatusBadge(selectedQuery.status)}
                  </div>
                  <h3 className="text-lg font-black text-white">{selectedQuery.subject}</h3>
                </div>

                <button
                  onClick={() => setSelectedQuery(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Feedback Banner */}
              {feedbackMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    feedbackMessage.type === "success"
                      ? "bg-emerald-950/60 border-emerald-600/60 text-emerald-300"
                      : "bg-rose-950/60 border-rose-600/60 text-rose-300"
                  }`}
                >
                  {feedbackMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{feedbackMessage.text}</span>
                </div>
              )}

              {/* Store & Merchant Context Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Target Store</span>
                  <div className="font-bold text-slate-200 flex items-center gap-1.5 mt-0.5">
                    <Store className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{selectedQuery.storeName}</span>
                    <span className="text-slate-500 font-mono text-[10px]">({selectedQuery.storeSlug})</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-500 text-[10px]">Current Status: </span>
                    <span
                      className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                        selectedQuery.store?.status === "SUSPENDED"
                          ? "bg-rose-950 text-rose-300 border border-rose-800"
                          : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      }`}
                    >
                      {selectedQuery.store?.status || "ACTIVE"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Merchant Account</span>
                  <div className="font-semibold text-slate-200 mt-0.5">{selectedQuery.userName || "Merchant"}</div>
                  <div className="text-slate-400 text-[11px]">{selectedQuery.userEmail}</div>
                </div>
              </div>

              {/* Merchant Appeal Statement */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Merchant Appeal Statement</span>
                </span>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedQuery.message}
                </div>
              </div>

              {/* Action & Resolution Form */}
              <form onSubmit={handleUpdateStatus} className="space-y-4 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Update Ticket Status
                    </label>
                    <select
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_REVIEW">Under Review / Investigating</option>
                      <option value="RESOLVED">Resolved (Approve / Closed)</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Official Reply to Merchant
                    </label>
                    <input
                      type="text"
                      value={resolutionMsg}
                      onChange={(e) => setResolutionMsg(e.target.value)}
                      placeholder="e.g. Account reinstated after policy review."
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Internal Admin Notes */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Internal Governance Notes (Admin Only)
                  </label>
                  <textarea
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal compliance notes, reasoning, or verification audit details..."
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                {/* Auto Un-suspend Option */}
                {selectedQuery.store?.status === "SUSPENDED" && targetStatus === "RESOLVED" && (
                  <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-600/50 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="autoUnsuspend"
                      checked={autoUnsuspend}
                      onChange={(e) => setAutoUnsuspend(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                    />
                    <label htmlFor="autoUnsuspend" className="text-xs font-bold text-indigo-200 cursor-pointer">
                      Automatically Un-suspend Store and restore full merchant access upon resolution
                    </label>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedQuery(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Close
                  </button>

                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Save & Apply Decision</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
}
