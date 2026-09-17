"use client";

import React, { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Lock,
  Percent,
  RefreshCw,
  Search,
  Check,
  X,
  AlertCircle,
  ArrowUpDown,
  ShieldCheck,
  Flame,
  Globe,
  DollarSign,
} from "lucide-react";

interface PricingTier {
  id: string;
  name: string;
  badge?: string;
  tagline?: string;
  description?: string;
  priceMonthlyInr: number;
  priceAnnualInr: number;
  priceMonthlyUsd: number;
  priceAnnualUsd: number;
  discountPercent: number;
  discountTag?: string;
  maxProducts: number;
  maxStaff: number;
  transactionFeePercent: number;
  customDomainAllowed: boolean;
  popular: boolean;
  sortOrder: number;
  features: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function PricingTiersPage() {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    badge: string;
    tagline: string;
    description: string;
    priceMonthlyInr: number;
    priceAnnualInr: number;
    priceMonthlyUsd: number;
    priceAnnualUsd: number;
    discountPercent: number;
    discountTag: string;
    maxProducts: number;
    maxStaff: number;
    transactionFeePercent: number;
    customDomainAllowed: boolean;
    popular: boolean;
    sortOrder: number;
    features: string[];
    isActive: boolean;
  }>({
    id: "",
    name: "",
    badge: "Starter",
    tagline: "",
    description: "",
    priceMonthlyInr: 0,
    priceAnnualInr: 0,
    priceMonthlyUsd: 0,
    priceAnnualUsd: 0,
    discountPercent: 0,
    discountTag: "",
    maxProducts: 10,
    maxStaff: 1,
    transactionFeePercent: 2.0,
    customDomainAllowed: false,
    popular: false,
    sortOrder: 1,
    features: [""],
    isActive: true,
  });

  const [featureInput, setFeatureInput] = useState("");

  // Master Admin Privileges
  const hasPricingTierPrivilege = user?.permissionsPricingTiers !== false;
  const hasDiscountPrivilege = user?.permissionsDiscounts !== false;

  useEffect(() => {
    loadPricingTiers();
  }, []);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadPricingTiers = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<{ tiers: PricingTier[] }>("/api/admin/pricing-tiers");
      if (data && data.tiers) {
        setTiers(data.tiers);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load pricing tiers", "error");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    if (!hasPricingTierPrivilege) {
      showToast("Access Denied: Master Admin pricing tier privilege required.", "error");
      return;
    }
    setIsEditing(false);
    setFormData({
      id: "",
      name: "",
      badge: "Starter",
      tagline: "",
      description: "",
      priceMonthlyInr: 0,
      priceAnnualInr: 0,
      priceMonthlyUsd: 0,
      priceAnnualUsd: 0,
      discountPercent: 0,
      discountTag: "",
      maxProducts: 50,
      maxStaff: 2,
      transactionFeePercent: 2.0,
      customDomainAllowed: false,
      popular: false,
      sortOrder: tiers.length + 1,
      features: [
        "1 Store Instance",
        "Default Theme Template",
        "Standard Checkout",
        "Community Support",
      ],
      isActive: true,
    });
    setFeatureInput("");
    setIsModalOpen(true);
  };

  const openEditModal = (tier: PricingTier) => {
    if (!hasPricingTierPrivilege) {
      showToast("Access Denied: Master Admin pricing tier privilege required.", "error");
      return;
    }
    setIsEditing(true);
    setFormData({
      id: tier.id,
      name: tier.name,
      badge: tier.badge || "",
      tagline: tier.tagline || "",
      description: tier.description || "",
      priceMonthlyInr: tier.priceMonthlyInr || 0,
      priceAnnualInr: tier.priceAnnualInr || 0,
      priceMonthlyUsd: tier.priceMonthlyUsd || 0,
      priceAnnualUsd: tier.priceAnnualUsd || 0,
      discountPercent: tier.discountPercent || 0,
      discountTag: tier.discountTag || "",
      maxProducts: tier.maxProducts,
      maxStaff: tier.maxStaff || 1,
      transactionFeePercent: tier.transactionFeePercent ?? 2.0,
      customDomainAllowed: Boolean(tier.customDomainAllowed),
      popular: Boolean(tier.popular),
      sortOrder: tier.sortOrder || 1,
      features: tier.features && tier.features.length > 0 ? [...tier.features] : [""],
      isActive: Boolean(tier.isActive),
    });
    setFeatureInput("");
    setIsModalOpen(true);
  };

  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features.filter((f) => f.trim().length > 0), featureInput.trim()],
    }));
    setFeatureInput("");
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== index),
    }));
  };

  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasPricingTierPrivilege) {
      showToast("Access Denied: Master Admin pricing tier privilege required.", "error");
      return;
    }

    if (!formData.name.trim() || (!isEditing && !formData.id.trim())) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    // Clean features list
    const cleanFeatures = formData.features.filter((f) => f.trim().length > 0);

    setSaving(true);
    try {
      if (isEditing) {
        await fetchApi(`/api/admin/pricing-tiers/${formData.id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...formData,
            features: cleanFeatures,
          }),
        });
        showToast(`Pricing tier '${formData.name}' updated successfully!`);
      } else {
        await fetchApi("/api/admin/pricing-tiers", {
          method: "POST",
          body: JSON.stringify({
            ...formData,
            features: cleanFeatures,
          }),
        });
        showToast(`Pricing tier '${formData.name}' created successfully!`);
      }

      setIsModalOpen(false);
      loadPricingTiers();
    } catch (err: any) {
      showToast(err.message || "Failed to save pricing tier", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTier = async (id: string) => {
    if (!hasPricingTierPrivilege) {
      showToast("Access Denied: Master Admin pricing tier privilege required.", "error");
      return;
    }

    try {
      await fetchApi(`/api/admin/pricing-tiers/${id}`, {
        method: "DELETE",
      });
      showToast(`Pricing tier '${id}' deleted successfully!`);
      setDeleteConfirmId(null);
      loadPricingTiers();
    } catch (err: any) {
      showToast(err.message || "Failed to delete pricing tier", "error");
    }
  };

  const filteredTiers = tiers.filter((tier) => {
    const q = search.toLowerCase();
    return (
      tier.name.toLowerCase().includes(q) ||
      tier.id.toLowerCase().includes(q) ||
      (tier.badge && tier.badge.toLowerCase().includes(q)) ||
      (tier.tagline && tier.tagline.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
              toast.type === "success"
                ? "bg-emerald-950 border-emerald-500/50 text-emerald-200"
                : "bg-rose-950 border-rose-500/50 text-rose-200"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            )}
            <span>{toast.text}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                Subscription Pricing Tiers
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Configure master subscription plans, dynamic billing amounts, product quotas, and promotional discounts across all stores.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadPricingTiers}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Refresh Pricing Tiers"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={openCreateModal}
              disabled={!hasPricingTierPrivilege}
              className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition shadow-lg ${
                hasPricingTierPrivilege
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 cursor-pointer"
                  : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Add Pricing Tier</span>
            </button>
          </div>
        </div>

        {/* Privilege Indicator Notice */}
        {(!hasPricingTierPrivilege || !hasDiscountPrivilege) && (
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Privilege Restriction Alert:</span>{" "}
              {!hasPricingTierPrivilege && (
                <span>You do not have permission to add or modify pricing tiers. </span>
              )}
              {!hasDiscountPrivilege && (
                <span>You do not have permission to apply promotional discounts. </span>
              )}
              Contact the Master Super-Admin to update your administrative permissions.
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tiers by name, ID, or badge..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Total Tiers: <span className="font-bold text-slate-200">{tiers.length}</span> ({tiers.filter(t => t.isActive).length} active)
          </div>
        </div>

        {/* Pricing Tier Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/50 rounded-3xl border border-slate-800/80 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <span>Loading database pricing tiers...</span>
          </div>
        ) : filteredTiers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/50 rounded-3xl border border-slate-800/80">
            <CreditCard className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="font-bold text-slate-300">No Pricing Tiers Found</p>
            <p className="text-xs text-slate-500 mt-1">Click &ldquo;Add Pricing Tier&rdquo; to create your first dynamic subscription plan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {filteredTiers.map((tier) => (
              <div
                key={tier.id}
                className={`p-6 rounded-3xl border flex flex-col justify-between transition-all duration-200 relative ${
                  tier.popular
                    ? "bg-gradient-to-b from-slate-900 via-indigo-950/20 to-slate-900 border-indigo-500/50 shadow-xl shadow-indigo-500/10"
                    : tier.isActive
                    ? "bg-slate-900 border-slate-800"
                    : "bg-slate-950 border-slate-900 opacity-60"
                }`}
              >
                {/* Popular Pill */}
                {tier.popular && (
                  <div className="absolute -top-3 right-5 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Popular Tier</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Header & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                        {tier.badge || tier.id}
                      </span>
                      <h3 className="text-xl font-bold text-slate-100 mt-1.5">{tier.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{tier.tagline || tier.description}</p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${
                        tier.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-800 text-slate-500 border-slate-700"
                      }`}
                    >
                      {tier.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Price Box */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-400 font-medium">Monthly:</span>
                      <span className="text-lg font-black text-slate-100">
                        ₹{tier.priceMonthlyInr?.toLocaleString()}{" "}
                        <span className="text-xs text-slate-400 font-normal">($ {tier.priceMonthlyUsd})</span>
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between border-t border-slate-800/80 pt-1.5">
                      <span className="text-xs text-slate-400 font-medium">Annual:</span>
                      <span className="text-sm font-bold text-indigo-300">
                        ₹{tier.priceAnnualInr?.toLocaleString()}{" "}
                        <span className="text-[11px] text-slate-400 font-normal">($ {tier.priceAnnualUsd}/yr)</span>
                      </span>
                    </div>

                    {tier.discountPercent > 0 && (
                      <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-rose-400">
                        <span className="flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          <span>Discount:</span>
                        </span>
                        <span>{tier.discountPercent}% Off</span>
                      </div>
                    )}
                    {tier.discountTag && (
                      <div className="text-[11px] text-rose-300 font-medium truncate">
                        🏷️ {tier.discountTag}
                      </div>
                    )}
                  </div>

                  {/* Limits & Details */}
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Products Limit:</span>
                      <span className="font-bold text-slate-200">
                        {tier.maxProducts === -1 ? "Unlimited" : tier.maxProducts.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Staff Limit:</span>
                      <span className="font-bold text-slate-200">{tier.maxStaff || 1} Seats</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Platform Fee:</span>
                      <span className="font-bold text-emerald-400">{tier.transactionFeePercent}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Custom Domain:</span>
                      <span className="font-bold">
                        {tier.customDomainAllowed ? (
                          <span className="text-emerald-400">Allowed</span>
                        ) : (
                          <span className="text-slate-500">Disabled</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Features Bullets */}
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Feature Highlights:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {(tier.features || []).slice(0, 4).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{feat}</span>
                        </li>
                      ))}
                      {(tier.features || []).length > 4 && (
                        <li className="text-[11px] text-slate-500 pl-5">
                          + {tier.features.length - 4} more features
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-5 border-t border-slate-800/80 mt-4 flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(tier)}
                    disabled={!hasPricingTierPrivilege}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      hasPricingTierPrivilege
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                        : "bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed"
                    }`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Tier</span>
                  </button>

                  {deleteConfirmId === tier.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteTier(tier.id)}
                        className="px-2.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition"
                        title="Confirm Delete"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2.5 py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(tier.id)}
                      disabled={!hasPricingTierPrivilege}
                      className={`p-2.5 rounded-xl transition ${
                        hasPricingTierPrivilege
                          ? "bg-slate-800/80 hover:bg-rose-950 hover:text-rose-400 text-slate-400 border border-slate-700 cursor-pointer"
                          : "bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed"
                      }`}
                      title="Delete Tier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">
                      {isEditing ? `Edit Pricing Tier: ${formData.name}` : "Create New Pricing Tier"}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {isEditing ? "Modify tier pricing, limits, and discount options." : "Set up a new subscription tier for stores."}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTier} className="space-y-5">
                {/* ID & Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Tier Unique ID *
                    </label>
                    <input
                      type="text"
                      disabled={isEditing}
                      placeholder="e.g. STARTER, PRO, ENTERPRISE"
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Free, Pro, Growing, Enterprise"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                {/* Badge & Tagline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Badge Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Starter, Fast Scale, Best Value"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Tagline / Subheading
                  </label>
                  <input
                    type="text"
                    placeholder="Short description displayed under tier title"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Pricing Fields */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    <span>Pricing Setup (INR & USD)</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Monthly (₹ INR)
                      </label>
                      <input
                        type="number"
                        value={formData.priceMonthlyInr}
                        onChange={(e) => setFormData({ ...formData, priceMonthlyInr: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Annual (₹ INR)
                      </label>
                      <input
                        type="number"
                        value={formData.priceAnnualInr}
                        onChange={(e) => setFormData({ ...formData, priceAnnualInr: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Monthly ($ USD)
                      </label>
                      <input
                        type="number"
                        value={formData.priceMonthlyUsd}
                        onChange={(e) => setFormData({ ...formData, priceMonthlyUsd: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Annual ($ USD)
                      </label>
                      <input
                        type="number"
                        value={formData.priceAnnualUsd}
                        onChange={(e) => setFormData({ ...formData, priceAnnualUsd: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Promotional Discount Setup (Protected by permissionsDiscounts) */}
                <div className={`p-4 rounded-2xl border space-y-4 ${
                  hasDiscountPrivilege
                    ? "bg-rose-950/20 border-rose-500/30"
                    : "bg-slate-950/40 border-slate-800 opacity-70"
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                      <Percent className="w-4 h-4" />
                      <span>Promotional Discount Privilege</span>
                    </h4>
                    {!hasDiscountPrivilege && (
                      <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Discount Privilege Locked</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Discount Percentage (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={!hasDiscountPrivilege}
                        value={formData.discountPercent}
                        onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-bold focus:outline-none focus:border-rose-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Discount Tagline / Marketing Pill
                      </label>
                      <input
                        type="text"
                        disabled={!hasDiscountPrivilege}
                        placeholder="e.g. Save ₹2,400 ✨ Best value"
                        value={formData.discountTag}
                        onChange={(e) => setFormData({ ...formData, discountTag: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-rose-500 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Quotas & Platform Fee */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Max Products (-1 for Unlimited)
                    </label>
                    <input
                      type="number"
                      value={formData.maxProducts}
                      onChange={(e) => setFormData({ ...formData, maxProducts: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Max Staff Seats
                    </label>
                    <input
                      type="number"
                      value={formData.maxStaff}
                      onChange={(e) => setFormData({ ...formData, maxStaff: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Platform Fee (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.transactionFeePercent}
                      onChange={(e) => setFormData({ ...formData, transactionFeePercent: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.popular}
                      onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-200">Featured / Popular</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.customDomainAllowed}
                      onChange={(e) => setFormData({ ...formData, customDomainAllowed: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-200">Custom Domain</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-200">Active Status</span>
                  </label>
                </div>

                {/* Dynamic Features List */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Feature Items Checklist
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add a new feature bullet..."
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                    >
                      Add
                    </button>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {formData.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                      >
                        <span className="truncate">{feat}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit & Cancel */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>{isEditing ? "Update Pricing Tier" : "Create Pricing Tier"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
}
