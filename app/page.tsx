"use client";

import React, { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import {
  Users,
  Store,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  PackageCheck,
  ShoppingBag,
  MousePointerClick,
  Globe,
  Award,
  Calendar,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface AnalyticsSummary {
  revenue: number;
  orders: number;
  averageOrderValue: number;
  customers: number;
  conversionRate: number;
  productsSold: number;
  abandonedCartsCount: number;
  abandonedCartsValue: number;
  totalTrafficSessions: number;
}

interface BestProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface SalesDateItem {
  date: string;
  revenue: number;
  orders: number;
}

interface SalesLocationItem {
  country: string;
  orders: number;
  revenue: number;
}

interface TrafficChannelItem {
  channel: string;
  sessions: number;
  percentage: number;
}

interface DashboardAnalyticsResponse {
  summary: AnalyticsSummary;
  bestSellingProducts: BestProduct[];
  salesByDate: SalesDateItem[];
  salesByLocation: SalesLocationItem[];
  trafficChannels: TrafficChannelItem[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<DashboardAnalyticsResponse>("/api/analytics/dashboard");
      setData(res);
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      setError(err.message || "Failed to load dashboard analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const summary = data?.summary;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
            <span>Platform Analytics & Performance Control</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time revenue, conversion rates, order metrics, regional sales & traffic performance.
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold border border-indigo-500/50 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Realtime Analytics</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. PRIMARY KPI METRICS GRID (Revenue, Orders, AOV, Customers, Conversion, Products Sold, Abandoned Carts) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Revenue */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-3 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-400 font-sans tracking-tight">
              ${summary ? summary.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
            </div>
            <p className="text-xs text-emerald-400/70 mt-1 font-medium">Gross Platform Sales</p>
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-3 group hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-100">{summary?.orders ?? 0}</div>
            <p className="text-xs text-indigo-400 mt-1 font-medium">Completed Checkout Orders</p>
          </div>
        </div>

        {/* KPI 3: Average Order Value (AOV) */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-3 group hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Order Value (AOV)</span>
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-purple-300">
              ${summary ? summary.averageOrderValue.toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-purple-400/80 mt-1 font-medium">Average Cart Value</p>
          </div>
        </div>

        {/* KPI 4: Customers */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-3 group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Customers</span>
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-100">{summary?.customers ?? 0}</div>
            <p className="text-xs text-blue-400 mt-1 font-medium">Unique Buyers & Subscribers</p>
          </div>
        </div>

        {/* KPI 5: Conversion Rate */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-3 group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversion Rate</span>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <MousePointerClick className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-amber-400">{summary?.conversionRate ?? 0}%</div>
            <p className="text-xs text-amber-400/80 mt-1 font-medium">Visitor to Checkout Ratio</p>
          </div>
        </div>

        {/* KPI 6: Products Sold */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-3 group hover:border-teal-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Products Sold</span>
            <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-teal-300">{summary?.productsSold ?? 0}</div>
            <p className="text-xs text-teal-400 mt-1 font-medium">Total Item Quantities Delivered</p>
          </div>
        </div>

        {/* KPI 7: Abandoned Carts */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-3 col-span-1 sm:col-span-2 group hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Abandoned Carts</span>
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-extrabold text-rose-400">{summary?.abandonedCartsCount ?? 0} Carts</div>
              <p className="text-xs text-rose-400/80 mt-1 font-medium">Pending checkout recovery emails</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Lost Potential Revenue</span>
              <span className="text-lg font-bold text-rose-300">
                ${summary ? summary.abandonedCartsValue.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. SECONDARY CHARTS & TABLES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* BEST SELLING PRODUCTS */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Best-Selling Products
            </h3>
            <span className="text-xs text-slate-400 font-medium">Top Ranked by Revenue</span>
          </div>

          <div className="space-y-3">
            {data?.bestSellingProducts && data.bestSellingProducts.length > 0 ? (
              data.bestSellingProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${idx === 0 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-slate-800 text-slate-400"}`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-100 text-sm">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.quantity} Units Sold</div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-emerald-400 text-sm">
                    ${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">No order product sales recorded yet.</div>
            )}
          </div>
        </div>

        {/* TRAFFIC & SOURCES */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <MousePointerClick className="w-5 h-5 text-indigo-400" />
              Traffic Analytics
            </h3>
            <span className="text-xs text-indigo-400 font-bold font-mono">{summary?.totalTrafficSessions.toLocaleString() || 0} Visits</span>
          </div>

          <div className="space-y-4">
            {data?.trafficChannels && data.trafficChannels.length > 0 ? (
              data.trafficChannels.map((tc, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-300">
                    <span>{tc.channel}</span>
                    <span className="font-mono text-slate-400">{tc.sessions.toLocaleString()} ({tc.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${tc.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">No traffic session channels recorded yet.</div>
            )}
          </div>
        </div>

      </div>

      {/* 3. TERTIARY BREAKDOWNS (Sales by Date & Sales by Location) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SALES BY DATE TIMELINE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Sales Timeline (Sales by Date)
            </h3>
            <span className="text-xs text-slate-400 font-medium">Past 14 Days</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {data?.salesByDate && data.salesByDate.length > 0 ? (
              data.salesByDate.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-950/60 border border-slate-800 p-3 rounded-2xl text-xs">
                  <div className="font-mono text-slate-300 font-semibold">{item.date}</div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">{item.orders} Orders</span>
                    <span className="font-mono font-bold text-emerald-400">
                      ${item.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">No sales data for timeline.</div>
            )}
          </div>
        </div>

        {/* SALES BY LOCATION */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              Sales by Location (Regional Breakdown)
            </h3>
            <span className="text-xs text-slate-400 font-medium">Global Markets</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {data?.salesByLocation && data.salesByLocation.length > 0 ? (
              data.salesByLocation.map((loc, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl text-xs">
                  <div className="font-semibold text-slate-200 flex items-center gap-2">
                    <span>🌍</span>
                    <span>{loc.country}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">{loc.orders} Orders</span>
                    <span className="font-mono font-bold text-emerald-400">
                      ${loc.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">No regional sales data available.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
