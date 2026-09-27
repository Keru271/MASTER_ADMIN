"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import {
  Store,
  Users,
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ShieldAlert,
  Zap,
  Building2,
  Mail,
  Send,
  Check,
  Search,
  Filter,
  Globe,
  Wallet,
} from "lucide-react";

interface FleetMetrics {
  totalStores: number;
  activeStores: number;
  suspendedStores: number;
  inactiveStores: number;
  totalMerchants: number;
  totalUsers: number;
  totalAdmins: number;
  storeRegistrationTrend: { date: string; count: number }[];
}

interface GatewayInfo {
  name: string;
  amount: number;
  currency: string;
  count: number;
  percentage: number;
  activeSubscribers: number;
}

interface IncomeMetrics {
  totalCollectedIncome: number;
  estimatedMrr: number;
  estimatedArr: number;
  arpu: number;
  monthlyIncome: number;
  annualIncome: number;
  gateways?: {
    razorpay: GatewayInfo;
    paypal: GatewayInfo;
    others: GatewayInfo;
  };
  totalGatewayVolume?: number;
}

interface TierItem {
  id: string;
  name: string;
  badge: string;
  monthlyPrice: number;
  storeCount: number;
  percentage: number;
  mrr: number;
}

interface TiersMetrics {
  mostPopularTier: TierItem;
  distribution: TierItem[];
}

interface PendingPaymentItem {
  id: string;
  type: string;
  invoiceNumber: string;
  storeId: string;
  storeName: string;
  storeSlug: string;
  ownerName: string;
  ownerEmail: string;
  tierName: string;
  billingCycle: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  dueDate: string;
  daysPending: number;
}

interface RecentInvoiceItem {
  id: string;
  invoiceNumber: string;
  storeName: string;
  storeSlug: string;
  ownerName: string;
  ownerEmail: string;
  tierName: string;
  billingCycle: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paidAt: string;
}

interface SaasAnalyticsResponse {
  success: boolean;
  fleet: FleetMetrics;
  income: IncomeMetrics;
  tiers: TiersMetrics;
  pendingPayments: {
    totalPendingCount: number;
    totalPendingAmount: number;
    list: PendingPaymentItem[];
  };
  recentInvoices: RecentInvoiceItem[];
}

// Format currency with symbol ($ for USD, ₹ for INR, etc.)
function formatPrice(amount: number, currency: string = "INR") {
  const curr = (currency || "INR").toUpperCase();
  const formatted = amount.toLocaleString(curr === "USD" ? "en-US" : "en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  if (curr === "USD") {
    return `$${formatted} USD`;
  }
  if (curr === "EUR") {
    return `€${formatted} EUR`;
  }
  if (curr === "GBP") {
    return `£${formatted} GBP`;
  }
  return `₹${formatted} INR`;
}

function formatAmountSymbol(amount: number, currency: string = "INR") {
  const curr = (currency || "INR").toUpperCase();
  const formatted = amount.toLocaleString(curr === "USD" ? "en-US" : "en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  if (curr === "USD") return `$${formatted}`;
  if (curr === "EUR") return `€${formatted}`;
  if (curr === "GBP") return `£${formatted}`;
  return `₹${formatted}`;
}

export default function MasterAdminDashboardPage() {
  const [data, setData] = useState<SaasAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [pendingFilter, setPendingFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadSaasAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<SaasAnalyticsResponse>("/api/admin/saas-analytics");
      if (res && res.success) {
        setData(res);
      } else {
        // Fallback to general admin stats
        const fallback = await fetchApi<any>("/api/admin/stats");
        if (fallback) {
          setData({
            success: true,
            fleet: {
              totalStores: fallback.totalStores || 0,
              activeStores: fallback.activeStores || 0,
              suspendedStores: fallback.suspendedStores || 0,
              inactiveStores: 0,
              totalMerchants: fallback.totalMerchants || 0,
              totalUsers: fallback.totalUsers || 0,
              totalAdmins: fallback.totalAdmins || 0,
              storeRegistrationTrend: [],
            },
            income: {
              totalCollectedIncome: fallback.totalRevenue || 0,
              estimatedMrr: (fallback.activeStores || 0) * 450,
              estimatedArr: (fallback.activeStores || 0) * 450 * 12,
              arpu: 450,
              monthlyIncome: fallback.totalRevenue || 0,
              annualIncome: 0,
              gateways: {
                razorpay: {
                  name: "Razorpay (UPI / Cards / NetBanking)",
                  amount: fallback.totalRevenue || 0,
                  currency: "INR",
                  count: fallback.activeStores || 0,
                  percentage: 100,
                  activeSubscribers: fallback.activeStores || 0,
                },
                paypal: {
                  name: "PayPal (Global / Cards)",
                  amount: 0,
                  currency: "USD",
                  count: 0,
                  percentage: 0,
                  activeSubscribers: 0,
                },
                others: {
                  name: "Other Gateways",
                  amount: 0,
                  currency: "INR",
                  count: 0,
                  percentage: 0,
                  activeSubscribers: 0,
                },
              },
            },
            tiers: {
              mostPopularTier: {
                id: "PRO",
                name: "Basic / Pro Plan",
                badge: "Fast Scale",
                monthlyPrice: 450,
                storeCount: fallback.activeStores || 0,
                percentage: 100,
                mrr: (fallback.activeStores || 0) * 450,
              },
              distribution: [],
            },
            pendingPayments: {
              totalPendingCount: 0,
              totalPendingAmount: 0,
              list: [],
            },
            recentInvoices: [],
          });
        }
      }
    } catch (err: any) {
      console.error("Failed to load SaaS analytics:", err);
      setError(err.message || "Failed to load platform subscription analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSaasAnalytics();
  }, []);

  const handleMarkAsPaid = async (item: PendingPaymentItem) => {
    setProcessingId(item.id);
    setActionMessage(null);
    try {
      await fetchApi(`/api/admin/store-payments/${item.id}/mark-paid`, {
        method: "PATCH",
        body: JSON.stringify({
          storeId: item.storeId,
          tierName: item.tierName,
          amount: item.amount,
          billingCycle: item.billingCycle,
          paymentMethod: item.paymentMethod,
        }),
      });

      setActionMessage(`Payment for store "${item.storeName}" marked as PAID successfully!`);
      await loadSaasAnalytics();
    } catch (err: any) {
      alert(err.message || "Failed to mark payment as paid.");
    } finally {
      setProcessingId(null);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const fleet = data?.fleet;
  const income = data?.income;
  const tiers = data?.tiers;
  const pending = data?.pendingPayments;
  const gateways = income?.gateways;

  // Filter pending payments
  const filteredPending = (pending?.list || []).filter((item) => {
    const matchesFilter =
      pendingFilter === "ALL" ||
      (pendingFilter === "OVERDUE" && (item.status === "OVERDUE" || item.daysPending > 3)) ||
      (pendingFilter === "PENDING" && item.status === "PENDING");

    const matchesSearch =
      !searchQuery.trim() ||
      item.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. TOP HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              SaaS Platform Control Center
            </span>
            <span className="text-xs text-slate-500 font-medium">Platform-Level SaaS Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-2 flex items-center gap-3">
            Store Registrations & Subscription Income
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Live telemetry tracking store registrations, recurring SaaS subscription revenues from store owners, Razorpay & PayPal gateway collections, tier adoption, and pending invoices.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={loadSaasAnalytics}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-indigo-500/50 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Refreshing..." : "Refresh Platform Telemetry"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-sm flex items-center gap-3 shadow-lg">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-sm flex items-center gap-3 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 2. PRIMARY EXECUTIVE SAAS KPI METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Total Registered Stores */}
        <Link href="/stores" className="block group">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-3 group-hover:border-indigo-500/50 transition-all shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Registered Stores</span>
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Store className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-100 flex items-baseline gap-2">
                <span>{fleet?.totalStores ?? 0}</span>
                <span className="text-xs font-semibold text-emerald-400">({fleet?.activeStores ?? 0} Active)</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-indigo-400 font-medium group-hover:underline">
                <span>{fleet?.suspendedStores ?? 0} Suspended • View store fleet</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </Link>

        {/* KPI 2: Total Store Owner Subscription Income */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-3 group hover:border-emerald-500/50 transition-all shadow-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Store Owners SaaS Income</span>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-400 font-sans tracking-tight">
              ₹{(income?.totalCollectedIncome || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-emerald-400/70 mt-1 font-medium">Total plan subscription revenue collected</p>
          </div>
        </div>

        {/* KPI 3: Monthly Recurring Revenue (MRR) */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-3 group hover:border-purple-500/50 transition-all shadow-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Estimated MRR</span>
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-purple-300">
              ₹{(income?.estimatedMrr || 0).toLocaleString("en-IN")} / mo
            </div>
            <p className="text-xs text-purple-400/80 mt-1 font-medium">
              ARR: ₹{(income?.estimatedArr || 0).toLocaleString("en-IN")} annualized run-rate
            </p>
          </div>
        </div>

        {/* KPI 4: Total Store Owners / Merchants */}
        <Link href="/users" className="block group">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-3 group-hover:border-blue-500/50 transition-all shadow-xl">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Store Owners & Merchants</span>
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-100 flex items-baseline gap-2">
                <span>{fleet?.totalMerchants ?? 0}</span>
                <span className="text-xs font-normal text-slate-500">({fleet?.totalUsers ?? 0} Total Users)</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-blue-400 font-medium group-hover:underline">
                <span>Manage merchant accounts</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* 3. RAZORPAY VS PAYPAL PAYMENT GATEWAY BREAKDOWN */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              <span>Payment Gateway Collections (Razorpay vs PayPal)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time comparison of subscription payments and fees received across Razorpay and PayPal payment channels.
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
            Total Gateway Volume: ₹{(income?.totalGatewayVolume ?? income?.totalCollectedIncome ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Gateway Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* RAZORPAY CARD */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-950 to-blue-950/40 border border-blue-500/40 rounded-3xl p-6 space-y-4 shadow-xl relative overflow-hidden group hover:border-blue-400 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm">
                  ₹
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white">Razorpay</h4>
                  <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">UPI • Cards • Netbanking</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-950 text-blue-300 border border-blue-700/60 text-[11px] font-mono font-bold">
                {gateways?.razorpay?.percentage ?? 0}% Share
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Paid in Razorpay</span>
              <div className="text-3xl font-extrabold text-blue-400 font-sans tracking-tight mt-1">
                {formatAmountSymbol(gateways?.razorpay?.amount || 0, "INR")}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {gateways?.razorpay?.count || 0} Successful Transactions Recorded
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Active Store Subscribers:</span>
              <span className="font-bold text-blue-300 font-mono">{gateways?.razorpay?.activeSubscribers || 0} Stores</span>
            </div>
          </div>

          {/* PAYPAL CARD */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-950 to-indigo-950/40 border border-indigo-500/40 rounded-3xl p-6 space-y-4 shadow-xl relative overflow-hidden group hover:border-indigo-400 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
                  $
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white">PayPal</h4>
                  <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Global USD • PayPal Wallet</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60 text-[11px] font-mono font-bold">
                {gateways?.paypal?.percentage ?? 0}% Share
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Paid in PayPal</span>
              <div className="text-3xl font-extrabold text-indigo-300 font-sans tracking-tight mt-1">
                {formatAmountSymbol(gateways?.paypal?.amount || 0, gateways?.paypal?.currency || "USD")}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {gateways?.paypal?.count || 0} Successful Transactions Recorded
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Active Store Subscribers:</span>
              <span className="font-bold text-indigo-300 font-mono">{gateways?.paypal?.activeSubscribers || 0} Stores</span>
            </div>
          </div>

          {/* OTHER GATEWAYS / SUMMARY CARD */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-sm">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-200">Other Channels</h4>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Direct / Invoices</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-900 text-slate-300 text-[11px] font-mono font-bold">
                {gateways?.others?.percentage ?? 0}%
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Other Transactions</span>
              <div className="text-3xl font-extrabold text-slate-200 font-sans tracking-tight mt-1">
                {formatAmountSymbol(gateways?.others?.amount || 0, "INR")}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {gateways?.others?.count || 0} Manual / Direct Invoices
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Gateway Auto-Capture:</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Enabled
              </span>
            </div>
          </div>
        </div>

        {/* Volume Distribution Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              Razorpay ({gateways?.razorpay?.percentage ?? 0}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              PayPal ({gateways?.paypal?.percentage ?? 0}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              Others ({gateways?.others?.percentage ?? 0}%)
            </span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 flex">
            <div
              className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-500"
              style={{ width: `${Math.max(gateways?.razorpay?.percentage || 0, 0)}%` }}
              title={`Razorpay: ₹${gateways?.razorpay?.amount || 0}`}
            />
            <div
              className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-full transition-all duration-500"
              style={{ width: `${Math.max(gateways?.paypal?.percentage || 0, 0)}%` }}
              title={`PayPal: $${gateways?.paypal?.amount || 0}`}
            />
            <div
              className="bg-gradient-to-r from-purple-600 to-purple-400 h-full transition-all duration-500"
              style={{ width: `${Math.max(gateways?.others?.percentage || 0, 0)}%` }}
              title={`Others: ₹${gateways?.others?.amount || 0}`}
            />
          </div>
        </div>
      </div>

      {/* 4. "WHICH TIER HAS THE MOST USERS" HERO CARD + SUBSCRIPTION TIERS BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* HERO CARD: WHICH TIER HAS THE MOST USERS */}
        <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              #1 Most Popular Plan
            </span>
            <Link href="/pricing" className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold">
              <span>Manage Tiers</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Tier With Most Users</span>
            <h2 className="text-2xl font-black text-white mt-1">
              {tiers?.mostPopularTier?.name || "Pro / Basic Plan"}
            </h2>
            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-4xl font-extrabold text-indigo-400 font-sans">
                {tiers?.mostPopularTier?.percentage || 0}%
              </span>
              <span className="text-xs text-slate-300 font-medium">
                of all registered store owners ({tiers?.mostPopularTier?.storeCount || 0} Stores)
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Subscription Price:</span>
              <span className="font-bold text-white">
                {tiers?.mostPopularTier?.monthlyPrice === 0 ? "Free ₹0" : `₹${tiers?.mostPopularTier?.monthlyPrice} / month`}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Monthly Revenue from Tier:</span>
              <span className="font-mono font-bold text-emerald-400">
                ₹{(tiers?.mostPopularTier?.mrr || 0).toLocaleString("en-IN")} / mo
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Target Segment:</span>
              <span className="text-indigo-300 font-medium">{tiers?.mostPopularTier?.badge}</span>
            </div>
          </div>
        </div>

        {/* SUBSCRIPTION TIER DISTRIBUTION GRID */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Store Subscriptions & Tier Distribution
            </h3>
            <span className="text-xs text-slate-400 font-medium">Active Fleet Share</span>
          </div>

          <div className="space-y-3.5">
            {tiers?.distribution && tiers.distribution.length > 0 ? (
              tiers.distribution.map((tier) => (
                <div key={tier.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          tier.id === "FREE"
                            ? "bg-slate-400"
                            : tier.id === "PRO"
                            ? "bg-indigo-400"
                            : tier.id === "TEAM"
                            ? "bg-emerald-400"
                            : tier.id === "ENTERPRISE"
                            ? "bg-purple-400"
                            : "bg-amber-400"
                        }`}
                      />
                      <span className="text-sm font-bold text-slate-100">{tier.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-semibold text-slate-400">
                        {tier.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-slate-400 font-medium">
                        <strong className="text-white">{tier.storeCount}</strong> Stores ({tier.percentage}%)
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        {tier.monthlyPrice === 0 ? "Free" : `₹${tier.mrr.toLocaleString("en-IN")}/mo`}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        tier.id === "FREE"
                          ? "bg-slate-500"
                          : tier.id === "PRO"
                          ? "bg-gradient-to-r from-indigo-500 to-indigo-400"
                          : tier.id === "TEAM"
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : tier.id === "ENTERPRISE"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500"
                          : "bg-gradient-to-r from-amber-500 to-yellow-400"
                      }`}
                      style={{ width: `${Math.max(tier.percentage, 2)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">No tier distribution recorded.</div>
            )}
          </div>
        </div>
      </div>

      {/* 5. PENDING STORE PAYMENTS LIST (UNPAID INVOICES & OVERDUE STORE RENEWALS) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Pending Store Owner Payments & Overdue Invoices</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review stores with pending subscription charges, overdue renewals, or unpaid SaaS billing invoices.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>
                {pending?.totalPendingCount ?? 0} Pending (₹{(pending?.totalPendingAmount ?? 0).toLocaleString("en-IN")})
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search store name, merchant owner, email, or invoice #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={pendingFilter}
            onChange={(e) => setPendingFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Pending Payments</option>
            <option value="OVERDUE">Overdue Only (&gt;3 Days)</option>
            <option value="PENDING">Pending Renewal</option>
          </select>
        </div>

        {/* Pending Payments Data Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase text-[10px] text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Store Name / Slug</th>
                <th className="py-3.5 px-4">Merchant Owner</th>
                <th className="py-3.5 px-4">Plan & Cycle</th>
                <th className="py-3.5 px-4">Pending Amount</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Status / Days</th>
                <th className="py-3.5 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/40">
              {filteredPending.length > 0 ? (
                filteredPending.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{item.storeName}</span>
                      </div>
                      <div className="text-[10px] font-mono text-indigo-400">/{item.storeSlug}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{item.ownerName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>{item.ownerEmail}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-200">{item.tierName}</span>
                      <div className="text-[10px] text-slate-400 uppercase">{item.billingCycle}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-amber-300 text-sm">
                      {formatPrice(item.amount, item.currency)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300">
                        {item.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === "OVERDUE"
                            ? "bg-rose-950/80 text-rose-300 border border-rose-800/60"
                            : "bg-amber-950/80 text-amber-300 border border-amber-800/60"
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {item.status} ({item.daysPending}d)
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleMarkAsPaid(item)}
                        disabled={processingId === item.id}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        {processingId === item.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        <span>Mark Paid</span>
                      </button>

                      <a
                        href={`mailto:${item.ownerEmail}?subject=OmniStore Payment Reminder for ${encodeURIComponent(item.storeName)}&body=Dear ${encodeURIComponent(item.ownerName)}, your subscription payment of ${encodeURIComponent(formatPrice(item.amount, item.currency))} for plan ${item.tierName} is currently pending.`}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all inline-flex items-center"
                        title="Send Email Reminder"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <span>No pending store payments matching current criteria. All merchant subscriptions up to date!</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. RECENT PAID INVOICES & STORE REGISTRATION TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RECENT PAID SUBSCRIPTION INVOICES */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              Recent Paid Store Invoices
            </h3>
            <span className="text-xs text-slate-400 font-medium">SaaS Payments</span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {data?.recentInvoices && data.recentInvoices.length > 0 ? (
              data.recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl text-xs">
                  <div>
                    <div className="font-semibold text-slate-100 flex items-center gap-2">
                      <span className="font-mono text-indigo-300">{inv.invoiceNumber}</span>
                      <span className="text-slate-500">•</span>
                      <span>{inv.storeName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{inv.ownerName}</span>
                      <span>•</span>
                      <span className="text-indigo-300 font-semibold">{inv.tierName} ({inv.billingCycle})</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-400 text-sm">
                      {formatPrice(inv.amount, inv.currency)}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(inv.paidAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-8 text-center">No paid subscription invoices recorded yet.</div>
            )}
          </div>
        </div>

        {/* STORE REGISTRATION GROWTH TIMELINE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              New Store Registrations Timeline (Past 14 Days)
            </h3>
            <span className="text-xs text-slate-400 font-medium">Merchant Growth</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3">
            {fleet?.storeRegistrationTrend && fleet.storeRegistrationTrend.length > 0 ? (
              fleet.storeRegistrationTrend.map((item, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl text-center space-y-1">
                  <div className="font-mono text-slate-400 text-[11px] font-semibold">{item.date.slice(5)}</div>
                  <div className="font-mono font-bold text-indigo-400 text-base">
                    +{item.count}
                  </div>
                  <div className="text-[10px] text-slate-500">Stores</div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center col-span-full">No daily registration data recorded.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
