"use client";

import React, { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import {
  Plus,
  Trash2,
  ExternalLink,
  Edit3,
  X,
  Lock,
  Globe,
  Image as ImageIcon,
  ShieldCheck,
  Check,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  previewImage?: string;
  demoUrl?: string;
  requiredTier?: string;
  accentColor: string;
  badge?: string;
  features?: string;
}

const TIER_OPTIONS = [
  { value: "ALL", label: "All Tiers (Free to everyone)", color: "bg-emerald-950 text-emerald-300 border-emerald-800" },
  { value: "STARTER", label: "Starter Plan & Above", color: "bg-blue-950 text-blue-300 border-blue-800" },
  { value: "GROWTH", label: "Growth Plan & Above", color: "bg-violet-950 text-violet-300 border-violet-800" },
  { value: "PRO", label: "Pro Plan & Above", color: "bg-amber-950 text-amber-300 border-amber-800" },
  { value: "AGENCY", label: "Agency Plan & Above", color: "bg-fuchsia-950 text-fuchsia-300 border-fuchsia-800" },
  { value: "ENTERPRISE", label: "Enterprise Only", color: "bg-rose-950 text-rose-300 border-rose-800" },
];

export default function TemplatesManagementPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [requiredTier, setRequiredTier] = useState("ALL");
  const [accentColor, setAccentColor] = useState("#3B82F6");
  const [badge, setBadge] = useState("Popular");
  const [features, setFeatures] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi<Template[]>("/api/templates");
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setName("");
    setSlug("");
    setTagline("");
    setDescription("");
    setPreviewImage("");
    setDemoUrl("");
    setRequiredTier("ALL");
    setAccentColor("#3B82F6");
    setBadge("Popular");
    setFeatures("");
    setShowModal(true);
  };

  const openEditModal = (tpl: Template) => {
    setEditingTemplate(tpl);
    setName(tpl.name || "");
    setSlug(tpl.slug || "");
    setTagline(tpl.tagline || "");
    setDescription(tpl.description || "");
    setPreviewImage(tpl.previewImage || "");
    setDemoUrl(tpl.demoUrl || "");
    setRequiredTier(tpl.requiredTier || "ALL");
    setAccentColor(tpl.accentColor || "#3B82F6");
    setBadge(tpl.badge || "");
    setFeatures(
      typeof tpl.features === "string"
        ? tpl.features
        : Array.isArray(tpl.features)
        ? (tpl.features as string[]).join(", ")
        : ""
    );
    setShowModal(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name,
      slug,
      tagline,
      description,
      previewImage: previewImage.trim() || null,
      demoUrl: demoUrl.trim() || null,
      urlLink: demoUrl.trim() || null,
      requiredTier: requiredTier || "ALL",
      accentColor,
      badge: badge.trim() || null,
      features: features.trim() || null,
    };

    try {
      if (editingTemplate) {
        // Update existing template
        try {
          await fetchApi(`/api/admin/templates/${editingTemplate.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          });
        } catch {
          await fetchApi(`/api/templates/${editingTemplate.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          });
        }
      }
 else {
        // Create new template
        try {
          await fetchApi("/api/admin/templates", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        } catch {
          await fetchApi("/api/templates", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        }
      }

      setShowModal(false);
      await loadTemplates();
    } catch (err: any) {
      alert(err.message || "Failed to save template.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id: string, templateName: string) => {
    if (!confirm(`Are you sure you want to delete template "${templateName}"?`)) return;

    setDeletingId(id);
    try {
      try {
        await fetchApi(`/api/admin/templates/${id}`, {
          method: "DELETE",
        });
      } catch {
        await fetchApi(`/api/templates/${id}`, {
          method: "DELETE",
        });
      }
      setTemplates((prev) => prev.filter((t) => t.id !== id && t.slug !== id));
      await loadTemplates();
    } catch (err: any) {
      alert(err.message || "Failed to delete template.");
    } finally {
      setDeletingId(null);
    }
  };

  const getTierBadge = (tier?: string) => {
    const found = TIER_OPTIONS.find((t) => t.value === (tier || "ALL").toUpperCase());
    return found || TIER_OPTIONS[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Marketplace Theme Templates</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage storefront themes, configure live preview URLs, preview image banners, and assign subscription tier access privileges.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Theme</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400">
          No templates found. Click "Add New Theme" to create your first template.
        </div>
      ) : (
        /* Grid of Templates */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => {
            const tierBadge = getTierBadge(tpl.requiredTier);
            return (
              <div
                key={tpl.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl relative group hover:border-slate-700 transition-all"
              >
                {/* Image Banner */}
                <div className="relative h-44 w-full bg-slate-950 overflow-hidden border-b border-slate-800">
                  {tpl.previewImage ? (
                    <img
                      src={tpl.previewImage}
                      alt={tpl.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2 bg-gradient-to-br from-slate-900 to-slate-950">
                      <ImageIcon className="w-8 h-8 opacity-40" />
                      <span className="text-xs">No Preview Image</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-80" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {tpl.badge && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900/90 text-indigo-300 border border-indigo-800/80 backdrop-blur-md shadow-xs">
                          {tpl.badge}
                        </span>
                      )}
                    </div>
                    {/* Tier badge */}
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border backdrop-blur-md shadow-xs flex items-center gap-1 ${tierBadge.color}`}
                    >
                      {tpl.requiredTier && tpl.requiredTier !== "ALL" && <Lock className="w-2.5 h-2.5" />}
                      <span>{tierBadge.label.split(" ")[0]} Tier</span>
                    </span>
                  </div>

                  {/* Accent Color Dot & Name on Banner */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-xs"
                        style={{ backgroundColor: tpl.accentColor }}
                      />
                      <span className="font-bold text-slate-100 text-sm drop-shadow-md">
                        {tpl.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-indigo-300 font-mono bg-slate-950/70 px-2 py-0.5 rounded-md border border-slate-800">
                      /{tpl.slug}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-3 flex-1">
                  {tpl.tagline && (
                    <p className="text-xs font-semibold text-indigo-400">
                      {tpl.tagline}
                    </p>
                  )}
                  <p className="text-xs text-slate-300 line-clamp-2">
                    {tpl.description || "Modern store layout template."}
                  </p>

                  <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-indigo-400" />
                      <span>{tierBadge.label}</span>
                    </span>
                    {tpl.demoUrl && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/50 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span>Live Preview Ready</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2 bg-slate-900/50">
                  {tpl.demoUrl ? (
                    <a
                      href={tpl.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Live Demo</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">No demo URL</span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(tpl)}
                      className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer text-xs flex items-center gap-1"
                      title="Edit Theme"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                      disabled={deletingId === tpl.id}
                      className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-400 hover:bg-rose-900 hover:text-white transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1 text-xs"
                      title="Delete Theme"
                    >
                      {deletingId === tpl.id ? (
                        <span className="animate-spin text-xs">⏳</span>
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Creating / Editing Theme */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  {editingTemplate ? `Edit Theme: ${editingTemplate.name}` : "Create New System Theme"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set template image, live demo URL, and subscription tier privilege.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Theme Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingTemplate && !slug) {
                        setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                      }
                    }}
                    placeholder="e.g. Nova Tech"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Theme Slug <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="nova-tech"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Sleek tech & gadget storefront theme"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the aesthetic, suitable merchandise, and standout design elements..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              {/* Preview Image URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
                  <span>Preview Image URL (Thumbnail Banner)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Direct image URL (HTTPS)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={previewImage}
                    onChange={(e) => setPreviewImage(e.target.value)}
                    placeholder="https://images.unsplash.com/... or https://cdn..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none text-xs font-mono"
                  />
                </div>
                {previewImage && (
                  <div className="mt-2 h-24 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <span className="absolute bottom-1 right-2 text-[10px] bg-slate-900/80 px-2 py-0.5 rounded text-slate-400">
                      Banner Preview
                    </span>
                  </div>
                )}
              </div>

              {/* Demo URL Link */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
                  <span>Live Demo / Preview URL</span>
                  <span className="text-[10px] text-slate-500 font-normal">Storefront demo website</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    placeholder="https://demo.owntheshop.com/nova-tech"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-10 text-slate-100 focus:border-indigo-500 focus:outline-none text-xs font-mono"
                  />
                  {demoUrl && (
                    <a
                      href={demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-indigo-400"
                      title="Test URL"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Accessible Tier Privilege */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Accessible Subscription Tier (Access Privilege)
                </label>
                <select
                  value={requiredTier}
                  onChange={(e) => setRequiredTier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  {TIER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.value})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Stores on this tier or higher will be able to publish and use this theme. Stores on lower tiers will see an upgrade lock.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-slate-800 p-0.5"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Popular / New / Luxury"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Features (Comma-separated or JSON list)
                </label>
                <input
                  type="text"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="Dark Mode, Express Drawer, High-Res Specs"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : editingTemplate ? "Update Theme" : "Create Theme"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
