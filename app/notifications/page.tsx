"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { fetchApi } from "@/lib/api";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Send,
  Save,
  CheckCircle2,
  Check,
  Package,
  Truck,
  PackageCheck,
  XCircle,
  RefreshCw,
  UserPlus,
  KeyRound,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

interface NotificationConfigItem {
  id?: string;
  trigger: string;
  title: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsAppEnabled: boolean;
  pushEnabled: boolean;
  subjectTemplate?: string;
  emailBodyTemplate?: string;
  smsBodyTemplate?: string;
  whatsAppTemplate?: string;
  pushBodyTemplate?: string;
}

export default function NotificationsPage() {
  const [stores, setStores] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [configs, setConfigs] = useState<NotificationConfigItem[]>([]);
  const [selectedTrigger, setSelectedTrigger] = useState<string>("ORDER_CONFIRMATION");
  const [activeChannel, setActiveChannel] = useState<"EMAIL" | "SMS" | "WHATSAPP" | "PUSH">("EMAIL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testTarget, setTestTarget] = useState("customer@example.com");
  const [toastMessage, setToastMessage] = useState("");

  // Current selected trigger form state
  const currentConfig = configs.find((c) => c.trigger === selectedTrigger) || {
    trigger: selectedTrigger,
    title: selectedTrigger,
    emailEnabled: true,
    smsEnabled: false,
    whatsAppEnabled: false,
    pushEnabled: false,
    subjectTemplate: "",
    emailBodyTemplate: "",
    smsBodyTemplate: "",
    whatsAppTemplate: "",
    pushBodyTemplate: "",
  };

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      loadNotificationConfigs(selectedStoreId);
    }
  }, [selectedStoreId]);

  const loadStores = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<{ id: string; name: string; slug: string }[]>("/admin/stores");
      setStores(data);
      if (data.length > 0) {
        setSelectedStoreId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load stores:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationConfigs = async (storeId: string) => {
    try {
      const data = await fetchApi<NotificationConfigItem[]>(`/notifications/configs?storeId=${storeId}`);
      setConfigs(data);
    } catch (err) {
      console.error("Failed to load notification configs:", err);
    }
  };

  const handleToggleChannel = (triggerKey: string, channelKey: "emailEnabled" | "smsEnabled" | "whatsAppEnabled" | "pushEnabled") => {
    setConfigs((prev) =>
      prev.map((c) => {
        if (c.trigger === triggerKey) {
          return { ...c, [channelKey]: !c[channelKey] };
        }
        return c;
      })
    );
  };

  const handleUpdateTemplate = (field: keyof NotificationConfigItem, val: any) => {
    setConfigs((prev) =>
      prev.map((c) => {
        if (c.trigger === selectedTrigger) {
          return { ...c, [field]: val };
        }
        return c;
      })
    );
  };

  const handleSaveTriggerConfig = async () => {
    if (!selectedTrigger) return;
    setSaving(true);
    try {
      await fetchApi(`/notifications/configs/${selectedTrigger}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...currentConfig,
          storeId: selectedStoreId,
        }),
      });

      setToastMessage(`Saved notification templates for ${currentConfig.title}!`);
      setTimeout(() => setToastMessage(""), 4000);
    } catch (err) {
      console.error("Failed to save notification config:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestNotification = async () => {
    setTestSending(true);
    try {
      await fetchApi("/notifications/dispatch-test", {
        method: "POST",
        body: JSON.stringify({
          trigger: selectedTrigger,
          channel: activeChannel,
          target: testTarget,
        }),
      });

      setToastMessage(`Dispatched test ${activeChannel} notification to ${testTarget}!`);
      setTimeout(() => setToastMessage(""), 4000);
    } catch (err) {
      console.error("Failed to send test notification:", err);
    } finally {
      setTestSending(false);
    }
  };

  const triggerIcons: Record<string, any> = {
    ORDER_CONFIRMATION: Package,
    ORDER_SHIPPED: Truck,
    ORDER_DELIVERED: PackageCheck,
    ORDER_CANCELLED: XCircle,
    REFUND: RefreshCw,
    CUSTOMER_REGISTRATION: UserPlus,
    PASSWORD_RESET: KeyRound,
    ABANDONED_CART: ShoppingBag,
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-6 max-w-7xl mx-auto pb-16">
        {/* Toast */}
        {toastMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <Bell className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Multi-Channel Notifications Engine</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure 8 event triggers across Email, SMS, WhatsApp & Web Push channels with live device previewers.
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
              onClick={handleSaveTriggerConfig}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Trigger Config"}
            </button>
          </div>
        </div>

        {/* Main Grid: Triggers Sidebar + Channel Configurator */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: 8 Event Triggers Navigation */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Event Triggers</h3>

            <div className="space-y-1.5">
              {configs.map((c) => {
                const Icon = triggerIcons[c.trigger] || Bell;
                const isSelected = selectedTrigger === c.trigger;
                const activeCount = [c.emailEnabled, c.smsEnabled, c.whatsAppEnabled, c.pushEnabled].filter(Boolean).length;

                return (
                  <button
                    key={c.trigger}
                    onClick={() => setSelectedTrigger(c.trigger)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-indigo-600/15 border-indigo-500/50 text-indigo-300"
                        : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isSelected ? "text-indigo-400" : "text-slate-400"}`} />
                      <div className="font-semibold text-xs leading-tight">{c.title}</div>
                    </div>

                    <span className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md text-slate-400">
                      {activeCount}/4 Channels
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Channel Configurator & Live Device Previewer */}
          <div className="lg:col-span-3 space-y-6">
            {/* Channel Active Toggles Header */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100">{currentConfig.title} Trigger Channels</h3>
                  <p className="text-xs text-slate-400">Select active delivery channels for this trigger event</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Test Target:</span>
                  <input
                    type="text"
                    value={testTarget}
                    onChange={(e) => setTestTarget(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-xl outline-none"
                  />
                  <button
                    onClick={handleSendTestNotification}
                    disabled={testSending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {testSending ? "Sending..." : `Send Test ${activeChannel}`}
                  </button>
                </div>
              </div>

              {/* 4 Delivery Channels Checkbox Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { key: "emailEnabled", label: "Email Channel", icon: Mail, color: "text-blue-400", channelId: "EMAIL" },
                  { key: "smsEnabled", label: "SMS Channel", icon: Smartphone, color: "text-emerald-400", channelId: "SMS" },
                  { key: "whatsAppEnabled", label: "WhatsApp API", icon: MessageSquare, color: "text-teal-400", channelId: "WHATSAPP" },
                  { key: "pushEnabled", label: "Web Push", icon: Bell, color: "text-purple-400", channelId: "PUSH" },
                ].map((ch) => {
                  const Icon = ch.icon;
                  const isChecked = (currentConfig as any)[ch.key];
                  const isChannelSelected = activeChannel === ch.channelId;

                  return (
                    <div
                      key={ch.key}
                      onClick={() => setActiveChannel(ch.channelId as any)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                        isChannelSelected
                          ? "bg-slate-800 border-indigo-500 shadow-lg shadow-indigo-600/10"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${ch.color}`} />
                          <span className="font-bold text-slate-200 text-xs">{ch.label}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleChannel(selectedTrigger, ch.key as any)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                        />
                      </div>
                      <span className={`text-[10px] font-mono ${isChecked ? "text-emerald-400 font-semibold" : "text-slate-500"}`}>
                        {isChecked ? "● ACTIVE DISPATCH" : "○ DISABLED"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Template Editors & Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Template Text Editor */}
              <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  {activeChannel} Template Configuration
                </h4>

                {activeChannel === "EMAIL" && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Email Subject Line
                      </label>
                      <input
                        type="text"
                        value={currentConfig.subjectTemplate || ""}
                        onChange={(e) => handleUpdateTemplate("subjectTemplate", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Email HTML Body Template
                      </label>
                      <textarea
                        rows={8}
                        value={currentConfig.emailBodyTemplate || ""}
                        onChange={(e) => handleUpdateTemplate("emailBodyTemplate", e.target.value)}
                        className="w-full bg-slate-950 font-mono text-xs text-slate-200 border border-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500 transition-all leading-relaxed"
                      />
                    </div>
                  </>
                )}

                {activeChannel === "SMS" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      SMS Text Message Body
                    </label>
                    <textarea
                      rows={5}
                      value={currentConfig.smsBodyTemplate || ""}
                      onChange={(e) => handleUpdateTemplate("smsBodyTemplate", e.target.value)}
                      className="w-full bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500 transition-all leading-relaxed"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Characters: {currentConfig.smsBodyTemplate?.length || 0} / 160 (1 SMS Segment)</p>
                  </div>
                )}

                {activeChannel === "WHATSAPP" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      WhatsApp Business API Card Template
                    </label>
                    <textarea
                      rows={6}
                      value={currentConfig.whatsAppTemplate || ""}
                      onChange={(e) => handleUpdateTemplate("whatsAppTemplate", e.target.value)}
                      className="w-full bg-slate-950 font-mono text-xs text-teal-300 border border-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500 transition-all leading-relaxed"
                    />
                  </div>
                )}

                {activeChannel === "PUSH" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Web Push Notification Toast Content
                    </label>
                    <textarea
                      rows={4}
                      value={currentConfig.pushBodyTemplate || ""}
                      onChange={(e) => handleUpdateTemplate("pushBodyTemplate", e.target.value)}
                      className="w-full bg-slate-950 font-mono text-xs text-purple-300 border border-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500 transition-all leading-relaxed"
                    />
                  </div>
                )}

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-400">Available Placeholders:</span>
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-400">
                    <span>{"{{customer_name}}"}</span>
                    <span>{"{{order_number}}"}</span>
                    <span>{"{{total_amount}}"}</span>
                    <span>{"{{tracking_number}}"}</span>
                    <span>{"{{tracking_url}}"}</span>
                    <span>{"{{store_name}}"}</span>
                    <span>{"{{cart_recovery_url}}"}</span>
                  </div>
                </div>
              </div>

              {/* Device Live Card Preview */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Device Card Preview</h4>

                {activeChannel === "EMAIL" && (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 font-sans shadow-lg">
                    <div className="text-xs text-slate-400 border-b border-slate-800 pb-2">
                      <div><strong className="text-slate-200">From:</strong> store@omnistore.internal</div>
                      <div><strong className="text-slate-200">Subject:</strong> {currentConfig.subjectTemplate || "Subject Preview"}</div>
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {currentConfig.emailBodyTemplate?.replace(/\{\{customer_name\}\}/g, "John Doe")
                        .replace(/\{\{order_number\}\}/g, "ORD-8942")
                        .replace(/\{\{total_amount\}\}/g, "$128.50")
                        .replace(/\{\{store_name\}\}/g, "OmniStore") || "Email body preview"}
                    </div>
                  </div>
                )}

                {activeChannel === "SMS" && (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 font-mono text-xs shadow-lg border-l-4 border-l-emerald-500">
                    <div className="text-[10px] text-emerald-400 font-bold">SMS MESSAGE</div>
                    <div className="text-slate-200 whitespace-pre-line">
                      {currentConfig.smsBodyTemplate?.replace(/\{\{customer_name\}\}/g, "John")
                        .replace(/\{\{order_number\}\}/g, "ORD-8942")
                        .replace(/\{\{total_amount\}\}/g, "$128.50")
                        .replace(/\{\{store_name\}\}/g, "OmniStore")
                        .replace(/\{\{tracking_url\}\}/g, "https://omni.link/t8942") || "SMS preview"}
                    </div>
                  </div>
                )}

                {activeChannel === "WHATSAPP" && (
                  <div className="bg-teal-950/40 border border-teal-800/60 rounded-2xl p-4 space-y-2 font-sans text-xs shadow-lg border-l-4 border-l-teal-500">
                    <div className="text-[10px] text-teal-300 font-bold flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-teal-400" /> WhatsApp Business
                    </div>
                    <div className="text-slate-200 whitespace-pre-line leading-relaxed">
                      {currentConfig.whatsAppTemplate?.replace(/\{\{customer_name\}\}/g, "John")
                        .replace(/\{\{order_number\}\}/g, "ORD-8942")
                        .replace(/\{\{total_amount\}\}/g, "$128.50")
                        .replace(/\{\{store_name\}\}/g, "OmniStore")
                        .replace(/\{\{tracking_url\}\}/g, "https://omni.link/t8942") || "WhatsApp preview"}
                    </div>
                  </div>
                )}

                {activeChannel === "PUSH" && (
                  <div className="bg-slate-950 border border-purple-800/60 rounded-2xl p-4 space-y-2 font-sans text-xs shadow-lg border-l-4 border-l-purple-500">
                    <div className="text-[10px] text-purple-300 font-bold flex items-center gap-1">
                      <Bell className="w-3 h-3 text-purple-400" /> Web Push Notification
                    </div>
                    <div className="text-slate-200 leading-snug">
                      {currentConfig.pushBodyTemplate?.replace(/\{\{customer_name\}\}/g, "John")
                        .replace(/\{\{order_number\}\}/g, "ORD-8942")
                        .replace(/\{\{store_name\}\}/g, "OmniStore") || "Push notification preview"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
