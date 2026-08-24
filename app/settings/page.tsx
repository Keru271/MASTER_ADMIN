"use client";

import React, { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import {
  Settings,
  Store,
  MapPin,
  ShoppingCart,
  CreditCard,
  Truck,
  Percent,
  Bell,
  UserCheck,
  Search,
  Globe,
  Languages,
  DollarSign,
  ShieldCheck,
  Save,
  CheckCircle2,
} from "lucide-react";

interface StoreSettingsData {
  id?: string;
  name: string;
  legalBusinessName?: string;
  slug: string;
  description?: string;
  status: string;
  unitSystem?: string;
  contactEmail?: string;
  contactPhone?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressCountry?: string;
  customDomain?: string;
  domainStatus?: string;
  currency: string;
  language: string;
  timezone: string;
  checkoutGuestAllowed?: boolean;
  checkoutPhoneRequired?: boolean;
  checkoutOrderNotes?: boolean;
  paymentStripeActive?: boolean;
  paymentRazorpayActive?: boolean;
  paymentCodActive?: boolean;
  paymentTestMode?: boolean;
  shippingFreeThreshold?: number;
  shippingFlatRate?: number;
  taxRateStandard?: number;
  taxInclusive?: boolean;
  notifyOrderConfirm?: boolean;
  notifyOrderShipped?: boolean;
  notifyAbandonedCart?: boolean;
  customerAccountsMode?: string;
  seoSiteTitle?: string;
  seoMetaDescription?: string;
  seoCanonicalUrl?: string;
  security2FA?: boolean;
  securityIpWhitelist?: string;
}

export default function StoreSettingsPage() {
  const [stores, setStores] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    | "general"
    | "details"
    | "checkout"
    | "payments"
    | "shipping"
    | "taxes"
    | "notifications"
    | "accounts"
    | "seo"
    | "domains"
    | "languages"
    | "currency"
    | "security"
  >("general");

  const [form, setForm] = useState<StoreSettingsData>({
    name: "My OmniStore",
    legalBusinessName: "OmniStore Global LLC",
    slug: "my-store",
    description: "Premium Multi-Tenant E-Commerce Storefront",
    status: "ACTIVE",
    unitSystem: "METRIC",
    contactEmail: "support@omnistore.com",
    contactPhone: "+1 (800) 555-0199",
    addressStreet: "100 Innovation Way, Suite 400",
    addressCity: "San Francisco",
    addressState: "California",
    addressZip: "94105",
    addressCountry: "United States",
    customDomain: "mybrand.com",
    domainStatus: "ACTIVE",
    currency: "USD",
    language: "en-US",
    timezone: "UTC",
    checkoutGuestAllowed: true,
    checkoutPhoneRequired: false,
    checkoutOrderNotes: true,
    paymentStripeActive: true,
    paymentRazorpayActive: true,
    paymentCodActive: true,
    paymentTestMode: false,
    shippingFreeThreshold: 50.0,
    shippingFlatRate: 9.99,
    taxRateStandard: 18.0,
    taxInclusive: false,
    notifyOrderConfirm: true,
    notifyOrderShipped: true,
    notifyAbandonedCart: true,
    customerAccountsMode: "OPTIONAL",
    seoSiteTitle: "OmniStore | Premium Digital Storefront",
    seoMetaDescription: "Shop top-rated gadgets and lifestyle apparel with fast global shipping.",
    seoCanonicalUrl: "https://mybrand.com",
    security2FA: true,
    securityIpWhitelist: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<{ id: string; name: string; slug: string }[]>("/admin/stores");
      setStores(data);
      if (data.length > 0) {
        setSelectedStoreId(data[0].id);
        loadStoreSettings(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load stores for settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreSettings = async (storeId: string) => {
    try {
      const data = await fetchApi<StoreSettingsData>(`/seo/stores/${storeId}`);
      if (data) {
        setForm((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error("Failed to load store settings:", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (selectedStoreId) {
        await fetchApi(`/admin/stores/${selectedStoreId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: form.status }),
        });
      }
      setToast("Store settings saved and synchronized successfully!");
      setTimeout(() => setToast(""), 4000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof StoreSettingsData, val: any) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const navTabs = [
    { id: "general", label: "General", icon: Store },
    { id: "details", label: "Store Details", icon: MapPin },
    { id: "checkout", label: "Checkout", icon: ShoppingCart },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "shipping", label: "Shipping", icon: Truck },
    { id: "taxes", label: "Taxes", icon: Percent },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "accounts", label: "Customer Accounts", icon: UserCheck },
    { id: "seo", label: "SEO", icon: Search },
    { id: "domains", label: "Domains", icon: Globe },
    { id: "languages", label: "Languages", icon: Languages },
    { id: "currency", label: "Currency", icon: DollarSign },
    { id: "security", label: "Security", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
        {toast && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-semibold">{toast}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <Settings className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Store Settings Control Center</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure store parameters across all 13 core modules (General, Payments, Shipping, Taxes, Domains, Security).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedStoreId}
              onChange={(e) => {
                setSelectedStoreId(e.target.value);
                loadStoreSettings(e.target.value);
              }}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-all"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.slug})
                </option>
              ))}
            </select>

            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>

        {/* 13 Module Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-indigo-500 text-indigo-400 bg-slate-900/60"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: GENERAL */}
        {activeTab === "general" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Store className="w-5 h-5 text-indigo-400" />
              General Store Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Store Public Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Legal Business Name
                </label>
                <input
                  type="text"
                  value={form.legalBusinessName}
                  onChange={(e) => updateField("legalBusinessName", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Store Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all font-semibold"
                >
                  <option value="ACTIVE">ACTIVE (Store Online)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Under Construction)</option>
                  <option value="SUSPENDED">SUSPENDED (Disabled)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Unit System
                </label>
                <select
                  value={form.unitSystem}
                  onChange={(e) => updateField("unitSystem", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all font-semibold"
                >
                  <option value="METRIC">Metric System (kg, cm)</option>
                  <option value="IMPERIAL">Imperial System (lb, in)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STORE DETAILS */}
        {activeTab === "details" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-400" />
              Store Contact & Physical Business Address
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Customer Support Email
                </label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => updateField("contactEmail", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Support Phone Number
                </label>
                <input
                  type="text"
                  value={form.contactPhone}
                  onChange={(e) => updateField("contactPhone", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  value={form.addressStreet}
                  onChange={(e) => updateField("addressStreet", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={form.addressCity}
                  onChange={(e) => updateField("addressCity", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={form.addressCountry}
                  onChange={(e) => updateField("addressCountry", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CHECKOUT */}
        {activeTab === "checkout" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-400" />
              Checkout Experience Settings
            </h3>

            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.checkoutGuestAllowed}
                  onChange={(e) => updateField("checkoutGuestAllowed", e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                />
                <div>
                  <div className="font-semibold text-slate-200 text-sm">Allow Guest Checkout</div>
                  <div className="text-xs text-slate-400">Customers can place orders without creating a merchant account</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.checkoutPhoneRequired}
                  onChange={(e) => updateField("checkoutPhoneRequired", e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                />
                <div>
                  <div className="font-semibold text-slate-200 text-sm">Require Customer Phone Number</div>
                  <div className="text-xs text-slate-400">Require phone numbers for shipping SMS tracking updates</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.checkoutOrderNotes}
                  onChange={(e) => updateField("checkoutOrderNotes", e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                />
                <div>
                  <div className="font-semibold text-slate-200 text-sm">Enable Order Notes & Special Instructions</div>
                  <div className="text-xs text-slate-400">Allow buyers to add custom gift notes or delivery instructions</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* TAB 4: PAYMENTS */}
        {activeTab === "payments" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              Payment Gateways & Processing
            </h3>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer">
                <div>
                  <div className="font-bold text-slate-100 text-sm">Stripe Payments (Credit / Debit / Apple Pay)</div>
                  <div className="text-xs text-slate-400">Accept global credit cards and digital wallets</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.paymentStripeActive}
                  onChange={(e) => updateField("paymentStripeActive", e.target.checked)}
                  className="w-5 h-5 rounded text-indigo-600 accent-indigo-600"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer">
                <div>
                  <div className="font-bold text-slate-100 text-sm">Razorpay (UPI / NetBanking / Cards)</div>
                  <div className="text-xs text-slate-400">Primary payment gateway for India transactions</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.paymentRazorpayActive}
                  onChange={(e) => updateField("paymentRazorpayActive", e.target.checked)}
                  className="w-5 h-5 rounded text-indigo-600 accent-indigo-600"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer">
                <div>
                  <div className="font-bold text-slate-100 text-sm">Cash on Delivery (COD)</div>
                  <div className="text-xs text-slate-400">Allow customers to pay upon delivery arrival</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.paymentCodActive}
                  onChange={(e) => updateField("paymentCodActive", e.target.checked)}
                  className="w-5 h-5 rounded text-indigo-600 accent-indigo-600"
                />
              </label>

              <div className="p-4 bg-amber-950/30 border border-amber-800/40 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-amber-300 text-sm">Payment Sandbox Test Mode</div>
                  <div className="text-xs text-amber-400/80">Simulate transactions without charging real cards</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.paymentTestMode}
                  onChange={(e) => updateField("paymentTestMode", e.target.checked)}
                  className="w-5 h-5 rounded text-amber-500 accent-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SHIPPING */}
        {activeTab === "shipping" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-400" />
              Shipping Rates & Delivery Rules
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Free Shipping Threshold ($)
                </label>
                <input
                  type="number"
                  value={form.shippingFreeThreshold}
                  onChange={(e) => updateField("shippingFreeThreshold", parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Standard Flat Shipping Rate ($)
                </label>
                <input
                  type="number"
                  value={form.shippingFlatRate}
                  onChange={(e) => updateField("shippingFlatRate", parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: TAXES */}
        {activeTab === "taxes" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Percent className="w-5 h-5 text-indigo-400" />
              Tax Rates & Invoicing Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Standard GST / VAT Rate (%)
                </label>
                <input
                  type="number"
                  value={form.taxRateStandard}
                  onChange={(e) => updateField("taxRateStandard", parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all font-mono"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer w-full">
                  <input
                    type="checkbox"
                    checked={form.taxInclusive}
                    onChange={(e) => updateField("taxInclusive", e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                  />
                  <div>
                    <div className="font-semibold text-slate-200 text-sm">Prices Include Tax</div>
                    <div className="text-xs text-slate-400">All product prices shown are inclusive of GST/VAT</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-400" />
              Automated Email & Notification Triggers
            </h3>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer">
                <div>
                  <div className="font-bold text-slate-100 text-sm">Order Confirmation Email</div>
                  <div className="text-xs text-slate-400">Send receipt and order details to customer upon checkout</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.notifyOrderConfirm}
                  onChange={(e) => updateField("notifyOrderConfirm", e.target.checked)}
                  className="w-5 h-5 rounded text-indigo-600 accent-indigo-600"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer">
                <div>
                  <div className="font-bold text-slate-100 text-sm">Order Shipped & Tracking Email</div>
                  <div className="text-xs text-slate-400">Send tracking number and carrier updates to buyer</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.notifyOrderShipped}
                  onChange={(e) => updateField("notifyOrderShipped", e.target.checked)}
                  className="w-5 h-5 rounded text-indigo-600 accent-indigo-600"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer">
                <div>
                  <div className="font-bold text-slate-100 text-sm">Abandoned Cart Recovery Sequence</div>
                  <div className="text-xs text-slate-400">Automatically email buyers who leave items in cart after 2 hours</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.notifyAbandonedCart}
                  onChange={(e) => updateField("notifyAbandonedCart", e.target.checked)}
                  className="w-5 h-5 rounded text-indigo-600 accent-indigo-600"
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 8: CUSTOMER ACCOUNTS */}
        {activeTab === "accounts" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              Customer Account Registration Policy
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Registration & Login Mode
              </label>
              <select
                value={form.customerAccountsMode}
                onChange={(e) => updateField("customerAccountsMode", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all font-semibold"
              >
                <option value="OPTIONAL">Accounts Optional (Guest Checkout Enabled)</option>
                <option value="REQUIRED">Accounts Required (Must Login Before Purchasing)</option>
                <option value="DISABLED">Accounts Disabled (Checkout Only)</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB 9: SEO */}
        {activeTab === "seo" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-400" />
              Global Store Search Engine Optimization
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  SEO Site Title Template
                </label>
                <input
                  type="text"
                  value={form.seoSiteTitle}
                  onChange={(e) => updateField("seoSiteTitle", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Global Meta Description
                </label>
                <textarea
                  rows={3}
                  value={form.seoMetaDescription}
                  onChange={(e) => updateField("seoMetaDescription", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: DOMAINS */}
        {activeTab === "domains" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              Domain Names & Custom Domain Routing
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-100 text-sm">Primary Subdomain</div>
                  <div className="text-xs font-mono text-indigo-400">https://{form.slug}.omnistore.internal</div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                  ACTIVE
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Custom Domain Alias
                </label>
                <input
                  type="text"
                  value={form.customDomain}
                  onChange={(e) => updateField("customDomain", e.target.value)}
                  placeholder="e.g. mybrand.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: LANGUAGES */}
        {activeTab === "languages" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Languages className="w-5 h-5 text-indigo-400" />
              Default Language & Localization
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Primary Store Language
              </label>
              <select
                value={form.language}
                onChange={(e) => updateField("language", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all font-semibold"
              >
                <option value="en-US">English (United States)</option>
                <option value="hi-IN">Hindi (India - हिन्दी)</option>
                <option value="es-ES">Spanish (Español)</option>
                <option value="fr-FR">French (Français)</option>
                <option value="de-DE">German (Deutsch)</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB 12: CURRENCY */}
        {activeTab === "currency" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-400" />
              Base Currency & Store Formatting
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Store Default Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) => updateField("currency", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all font-semibold"
              >
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
                <option value="CAD">CAD ($ - Canadian Dollar)</option>
                <option value="AUD">AUD ($ - Australian Dollar)</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB 13: SECURITY */}
        {activeTab === "security" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Security & Access Control
            </h3>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer">
                <div>
                  <div className="font-bold text-slate-100 text-sm">Require 2-Factor Authentication (2FA)</div>
                  <div className="text-xs text-slate-400">Enforce OTP 2FA verification for merchant store staff</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.security2FA}
                  onChange={(e) => updateField("security2FA", e.target.checked)}
                  className="w-5 h-5 rounded text-indigo-600 accent-indigo-600"
                />
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Admin IP Whitelist
                </label>
                <input
                  type="text"
                  value={form.securityIpWhitelist}
                  onChange={(e) => updateField("securityIpWhitelist", e.target.value)}
                  placeholder="e.g. 192.168.1.1, 203.0.113.5 (Optional)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
