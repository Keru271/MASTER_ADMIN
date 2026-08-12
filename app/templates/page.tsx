"use client";

import React, { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Palette, Plus, Trash2, CheckCircle2, Sparkles, RefreshCw, X } from "lucide-react";

interface Template {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  previewImage?: string;
  accentColor: string;
  badge?: string;
  features?: string;
}

export default function TemplatesManagementPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [accentColor, setAccentColor] = useState("#3B82F6");
  const [badge, setBadge] = useState("Popular");
  const [features, setFeatures] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await fetchApi("/api/admin/templates", {
        method: "POST",
        body: JSON.stringify({
          name,
          slug,
          tagline,
          description,
          previewImage,
          accentColor,
          badge,
          features,
        }),
      });

      setShowAddModal(false);
      resetForm();
      await loadTemplates();
    } catch (err: any) {
      alert(err.message || "Failed to create template.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id: string, templateName: string) => {
    if (!confirm(`Are you sure you want to delete template "${templateName}"?`)) return;

    try {
      await fetchApi(`/api/admin/templates/${id}`, {
        method: "DELETE",
      });
      await loadTemplates();
    } catch (err: any) {
      alert(err.message || "Failed to delete template.");
    }
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    setTagline("");
    setDescription("");
    setPreviewImage("");
    setAccentColor("#3B82F6");
    setBadge("Popular");
    setFeatures("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Marketplace Theme Templates</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage official themes and templates available for merchants to customize their storefronts.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
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

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <div key={tpl.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between p-6 shadow-xl relative group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-slate-700"
                    style={{ backgroundColor: tpl.accentColor }}
                  />
                  <span className="font-bold text-slate-100">{tpl.name}</span>
                </div>
                {tpl.badge && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {tpl.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-400 font-mono mb-2">/{tpl.slug}</p>
              <p className="text-sm text-slate-300 mb-4">{tpl.tagline || tpl.description || "Modern e-commerce store layout theme."}</p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">ID: {tpl.id.slice(0, 8)}...</span>
              <button
                onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-400 hover:bg-rose-900 hover:text-white transition-all cursor-pointer"
                title="Delete Theme"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Adding Theme */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-100">Create New System Theme</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Theme Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                    }}
                    placeholder="e.g. Nova Tech"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Theme Slug</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="nova-tech"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-slate-800"
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
                    placeholder="Popular / New"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
                >
                  {submitting ? "Saving..." : "Create Theme"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
