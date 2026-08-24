"use client";

import React, { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import {
  Code2,
  Key,
  Webhook,
  Code,
  FileCode,
  Globe,
  ShoppingCart,
  BookOpen,
  Activity,
  Boxes,
  Plus,
  Trash2,
  Send,
  Save,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  secret: string;
  scopes: string;
  lastUsedAt?: string;
  createdAt: string;
}

interface WebhookLogItem {
  id: string;
  event: string;
  statusCode: number;
  latencyMs: number;
  payloadJson: string;
  responseBody?: string;
  createdAt: string;
}

interface WebhookEndpointItem {
  id: string;
  url: string;
  events: string;
  secret: string;
  status: string;
  createdAt: string;
  logs: WebhookLogItem[];
}

interface DeveloperConfigData {
  customCss?: string;
  headerScripts?: string;
  footerScripts?: string;
  customCheckoutCss?: string;
  checkoutRedirectUrl?: string;
  integrationKlaviyo?: string;
  integrationMailchimp?: string;
  integrationShippo?: string;
  integrationZapier?: string;
  apiRequestsMonth: number;
  apiQuotaLimit: number;
}

export default function DeveloperPage() {
  const [stores, setStores] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "apikeys" | "webhooks" | "scripts" | "css" | "domain" | "checkout" | "api" | "logs" | "usage" | "integrations"
  >("apikeys");

  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpointItem[]>([]);
  const [devConfig, setDevConfig] = useState<DeveloperConfigData>({
    customCss: "",
    headerScripts: "",
    footerScripts: "",
    customCheckoutCss: "",
    checkoutRedirectUrl: "",
    integrationKlaviyo: "",
    integrationMailchimp: "",
    integrationShippo: "",
    integrationZapier: "",
    apiRequestsMonth: 48920,
    apiQuotaLimit: 100000,
  });

  // Modal / Input states
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState("read_products,write_orders");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState("order.created,order.fulfilled");

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      loadDeveloperData(selectedStoreId);
    }
  }, [selectedStoreId]);

  const loadStores = async () => {
    try {
      const data = await fetchApi<{ id: string; name: string; slug: string }[]>("/admin/stores");
      setStores(data);
      if (data.length > 0) {
        setSelectedStoreId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load stores:", err);
    }
  };

  const loadDeveloperData = async (storeId: string) => {
    try {
      const [keysData, webhooksData, configData] = await Promise.all([
        fetchApi<ApiKeyItem[]>(`/developer/keys?storeId=${storeId}`),
        fetchApi<WebhookEndpointItem[]>(`/developer/webhooks?storeId=${storeId}`),
        fetchApi<DeveloperConfigData>(`/developer/config?storeId=${storeId}`),
      ]);

      setApiKeys(keysData);
      setWebhooks(webhooksData);
      if (configData) setDevConfig(configData);
    } catch (err) {
      console.error("Failed to load developer platform data:", err);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;
    try {
      await fetchApi("/developer/keys", {
        method: "POST",
        body: JSON.stringify({
          name: newKeyName,
          scopes: newKeyScopes,
          storeId: selectedStoreId,
        }),
      });

      setNewKeyName("");
      setToastMessage("Generated new production API Secret Key!");
      setTimeout(() => setToastMessage(""), 4000);
      loadDeveloperData(selectedStoreId);
    } catch (err) {
      console.error("Failed to create API key:", err);
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    if (!confirm("Revoke this API key? Applications using it will lose API access immediately.")) return;
    try {
      await fetchApi(`/developer/keys/${id}`, { method: "DELETE" });
      setToastMessage("API Key revoked successfully.");
      setTimeout(() => setToastMessage(""), 4000);
      loadDeveloperData(selectedStoreId);
    } catch (err) {
      console.error("Failed to revoke API key:", err);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl) return;
    try {
      await fetchApi("/developer/webhooks", {
        method: "POST",
        body: JSON.stringify({
          url: newWebhookUrl,
          events: newWebhookEvents,
          storeId: selectedStoreId,
        }),
      });

      setNewWebhookUrl("");
      setToastMessage("Registered new webhook endpoint!");
      setTimeout(() => setToastMessage(""), 4000);
      loadDeveloperData(selectedStoreId);
    } catch (err) {
      console.error("Failed to create webhook:", err);
    }
  };

  const handleTestWebhookPing = async (id: string) => {
    try {
      await fetchApi(`/developer/webhooks/${id}/test`, { method: "POST" });
      setToastMessage("Dispatched test payload ping! Delivery status: 200 OK.");
      setTimeout(() => setToastMessage(""), 4000);
      loadDeveloperData(selectedStoreId);
    } catch (err) {
      console.error("Failed to test webhook:", err);
    }
  };

  const handleSaveDevConfig = async () => {
    setSaving(true);
    try {
      await fetchApi("/developer/config", {
        method: "PATCH",
        body: JSON.stringify({
          ...devConfig,
          storeId: selectedStoreId,
        }),
      });

      setToastMessage("Saved developer configurations and integration secrets!");
      setTimeout(() => setToastMessage(""), 4000);
    } catch (err) {
      console.error("Failed to save developer config:", err);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const tabs = [
    { id: "apikeys", label: "1. API Keys", icon: Key },
    { id: "webhooks", label: "2. Webhooks", icon: Webhook },
    { id: "scripts", label: "3. Custom Scripts", icon: Code },
    { id: "css", label: "4. Custom CSS", icon: FileCode },
    { id: "domain", label: "5. Custom Domain", icon: Globe },
    { id: "checkout", label: "6. Custom Checkout", icon: ShoppingCart },
    { id: "api", label: "7. Developer API", icon: BookOpen },
    { id: "logs", label: "8. Webhook Logs", icon: Zap },
    { id: "usage", label: "9. API Usage", icon: Activity },
    { id: "integrations", label: "10. Integrations", icon: Boxes },
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
        {toastMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <Code2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Advanced Developer Platform</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Enterprise developer tools: API Keys, Webhooks, Custom Scripts/CSS, REST API Docs, & Apps.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-all"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.slug})
                </option>
              ))}
            </select>

            <button
              onClick={handleSaveDevConfig}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Config"}
            </button>
          </div>
        </div>

        {/* 10 Feature Tabs Bar */}
        <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-1">
          {tabs.map((tab) => {
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

        {/* TAB 1: API KEYS */}
        {activeTab === "apikeys" && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                Generate Enterprise API Key
              </h3>

              <form onSubmit={handleCreateApiKey} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Key Name / Identifier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ERP Backend Sync"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Scope Permissions
                  </label>
                  <input
                    type="text"
                    value={newKeyScopes}
                    onChange={(e) => setNewKeyScopes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Generate Secret Key
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 uppercase text-xs text-slate-400 tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6">Key Name</th>
                    <th className="py-4 px-6">API Secret Token</th>
                    <th className="py-4 px-6">Granted Scopes</th>
                    <th className="py-4 px-6">Created</th>
                    <th className="py-4 px-6 text-right">Revoke</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {apiKeys.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-100">{k.name}</td>
                      <td className="py-4 px-6 font-mono text-xs text-indigo-300 flex items-center gap-2">
                        <span>{k.key}</span>
                        <button
                          onClick={() => copyToClipboard(k.key, k.id)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          {copiedKey === k.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-xs font-mono text-slate-400">{k.scopes}</td>
                      <td className="py-4 px-6 text-xs text-slate-400">{new Date(k.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleRevokeApiKey(k.id)}
                          className="p-2 hover:bg-rose-950/60 text-rose-400 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: WEBHOOKS */}
        {activeTab === "webhooks" && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Webhook className="w-5 h-5 text-indigo-400" />
                Register Webhook Endpoint
              </h3>

              <form onSubmit={handleCreateWebhook} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Payload Destination URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://api.mybrand.com/webhooks"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Subscribed Event Topics
                  </label>
                  <input
                    type="text"
                    value={newWebhookEvents}
                    onChange={(e) => setNewWebhookEvents(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Endpoint
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-4">
              {webhooks.map((wh) => (
                <div key={wh.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-100 text-sm font-mono flex items-center gap-2">
                        <span>{wh.url}</span>
                        <span className="bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                          {wh.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-mono">
                        Topics: <span className="text-indigo-400">{wh.events}</span> | Signing Secret:{" "}
                        <span className="text-slate-300">{wh.secret}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTestWebhookPing(wh.id)}
                      className="bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Test Ping
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOM SCRIPTS */}
        {activeTab === "scripts" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Code className="w-5 h-5 text-indigo-400" />
              Header & Footer Script Injections
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Header HTML / JS Snippets (e.g. Google Tag Manager)
                </label>
                <textarea
                  rows={6}
                  value={devConfig.headerScripts || ""}
                  onChange={(e) => setDevConfig({ ...devConfig, headerScripts: e.target.value })}
                  className="w-full bg-slate-950 font-mono text-xs text-slate-200 border border-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500 transition-all leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Footer HTML / JS Snippets (e.g. LiveChat Widget, Hotjar)
                </label>
                <textarea
                  rows={6}
                  value={devConfig.footerScripts || ""}
                  onChange={(e) => setDevConfig({ ...devConfig, footerScripts: e.target.value })}
                  className="w-full bg-slate-950 font-mono text-xs text-slate-200 border border-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500 transition-all leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CUSTOM CSS */}
        {activeTab === "css" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-indigo-400" />
              Custom Theme CSS Overrides
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                CSS Code Editor
              </label>
              <textarea
                rows={12}
                value={devConfig.customCss || ""}
                onChange={(e) => setDevConfig({ ...devConfig, customCss: e.target.value })}
                className="w-full bg-slate-950 font-mono text-xs text-indigo-300 border border-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500 transition-all leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* TAB 5: CUSTOM DOMAIN */}
        {activeTab === "domain" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              Custom Domain Routing & SSL Status
            </h3>

            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-100 text-sm">Primary Custom Domain</div>
                  <div className="text-xs font-mono text-indigo-400 mt-0.5">https://mybrand.com</div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> SSL ACTIVE
                </span>
              </div>

              <div className="text-xs text-slate-400 space-y-2 border-t border-slate-800 pt-3">
                <div className="font-semibold text-slate-200">DNS CNAME Record Target:</div>
                <div className="font-mono text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between">
                  <span>cname.omnistore.internal</span>
                  <span className="text-emerald-400">✓ VERIFIED</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CUSTOM CHECKOUT */}
        {activeTab === "checkout" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-400" />
              Custom Checkout Styling & Post-Order Redirects
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Post-Checkout Completion Redirect URL
                </label>
                <input
                  type="text"
                  value={devConfig.checkoutRedirectUrl || ""}
                  onChange={(e) => setDevConfig({ ...devConfig, checkoutRedirectUrl: e.target.value })}
                  placeholder="https://mybrand.com/thank-you"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Checkout Page Custom CSS
                </label>
                <textarea
                  rows={6}
                  value={devConfig.customCheckoutCss || ""}
                  onChange={(e) => setDevConfig({ ...devConfig, customCheckoutCss: e.target.value })}
                  className="w-full bg-slate-950 font-mono text-xs text-indigo-300 border border-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500 transition-all leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: DEVELOPER API */}
        {activeTab === "api" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Developer REST API Reference
            </h3>

            <div className="space-y-3 font-mono text-xs">
              {[
                { method: "GET", path: "/api/v1/products", desc: "List catalog products with pagination & filters" },
                { method: "POST", path: "/api/v1/products", desc: "Create product item with variants & images" },
                { method: "GET", path: "/api/v1/orders", desc: "Fetch merchant orders & fulfillment status" },
                { method: "POST", path: "/api/v1/orders", desc: "Submit checkout order programmatically" },
                { method: "GET", path: "/api/v1/customers", desc: "List customer profiles & lifetime spending" },
              ].map((api, idx) => (
                <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-bold px-2.5 py-1 rounded-md text-[10px] ${
                        api.method === "GET" ? "bg-blue-950 text-blue-400 border border-blue-800" : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      }`}
                    >
                      {api.method}
                    </span>
                    <span className="font-bold text-slate-200">{api.path}</span>
                  </div>
                  <span className="text-slate-400 font-sans text-xs">{api.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: WEBHOOK LOGS */}
        {activeTab === "logs" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 uppercase text-xs text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Topic Event</th>
                  <th className="py-4 px-6">HTTP Status</th>
                  <th className="py-4 px-6">Latency</th>
                  <th className="py-4 px-6">Payload</th>
                  <th className="py-4 px-6">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {webhooks.flatMap((w) => w.logs || []).map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-indigo-400 font-mono text-xs">{l.event}</td>
                    <td className="py-4 px-6 font-mono text-xs text-emerald-400 font-bold">{l.statusCode} OK</td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">{l.latencyMs} ms</td>
                    <td className="py-4 px-6 font-mono text-[11px] text-slate-300 truncate max-w-xs">{l.payloadJson}</td>
                    <td className="py-4 px-6 text-xs text-slate-400">{new Date(l.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 9: API USAGE */}
        {activeTab === "usage" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              API Call Usage & Rate Limits
            </h3>

            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-sm">Monthly Quota Consumption</span>
                <span className="font-mono text-xs text-indigo-400 font-bold">
                  {devConfig.apiRequestsMonth.toLocaleString()} / {devConfig.apiQuotaLimit.toLocaleString()} Calls (48.9%)
                </span>
              </div>

              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all"
                  style={{ width: `${(devConfig.apiRequestsMonth / devConfig.apiQuotaLimit) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: INTEGRATION CREDENTIALS */}
        {activeTab === "integrations" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-indigo-400" />
              Third-Party Enterprise Integration Credentials
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Klaviyo Email Marketing API Key
                </label>
                <input
                  type="password"
                  value={devConfig.integrationKlaviyo || ""}
                  onChange={(e) => setDevConfig({ ...devConfig, integrationKlaviyo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Mailchimp API Secret Key
                </label>
                <input
                  type="password"
                  value={devConfig.integrationMailchimp || ""}
                  onChange={(e) => setDevConfig({ ...devConfig, integrationMailchimp: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Shippo Carrier Logistics API Token
                </label>
                <input
                  type="password"
                  value={devConfig.integrationShippo || ""}
                  onChange={(e) => setDevConfig({ ...devConfig, integrationShippo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Zapier Automation Webhook Secret
                </label>
                <input
                  type="password"
                  value={devConfig.integrationZapier || ""}
                  onChange={(e) => setDevConfig({ ...devConfig, integrationZapier: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
