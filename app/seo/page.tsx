"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { fetchApi } from "@/lib/api";
import {
  Globe,
  Search,
  FileCode,
  Share2,
  Package,
  Save,
  CheckCircle2,
  ExternalLink,
  Code2,
  Sparkles,
} from "lucide-react";

interface StoreItem {
  id: string;
  name: string;
  slug: string;
  customDomain?: string;
  seoSiteTitle?: string;
  seoMetaDescription?: string;
  seoCanonicalUrl?: string;
  seoOgTitle?: string;
  seoOgDescription?: string;
  seoOgImage?: string;
  seoRobotsTxt?: string;
  seoStructuredDataJson?: string;
}

interface ProductSeoItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  seoTitle?: string;
  seoDescription?: string;
  urlSlug?: string;
  ogImage?: string;
  canonicalUrl?: string;
  structuredDataJson?: string;
}

export default function SeoGovernancePage() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<StoreItem | null>(null);
  const [activeTab, setActiveTab] = useState<"global" | "og" | "robots" | "schema" | "products">("global");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Global SEO Form State
  const [siteTitle, setSiteTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDesc, setOgDesc] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [robotsTxt, setRobotsTxt] = useState("");
  const [structuredData, setStructuredData] = useState("");

  // Product SEO State
  const [products, setProducts] = useState<ProductSeoItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [prodSeoTitle, setProdSeoTitle] = useState("");
  const [prodSeoDesc, setProdSeoDesc] = useState("");
  const [prodUrlSlug, setProdUrlSlug] = useState("");
  const [prodOgImage, setProdOgImage] = useState("");
  const [prodCanonicalUrl, setProdCanonicalUrl] = useState("");

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      loadStoreSeo(selectedStoreId);
    }
  }, [selectedStoreId]);

  const loadStores = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<StoreItem[]>("/admin/stores");
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

  const loadStoreSeo = async (storeId: string) => {
    try {
      const data = await fetchApi<StoreItem>(`/seo/stores/${storeId}`);
      setSelectedStore(data);
      setSiteTitle(data.seoSiteTitle || `${data.name} | Official Store`);
      setMetaDesc(data.seoMetaDescription || `Shop premium products on ${data.name}. Enjoy fast shipping and exclusive deals.`);
      setCanonicalUrl(data.seoCanonicalUrl || (data.customDomain ? `https://${data.customDomain}` : `https://${data.slug}.omnistore.internal`));
      setOgTitle(data.seoOgTitle || data.name);
      setOgDesc(data.seoOgDescription || data.seoMetaDescription || `Discover the latest catalog on ${data.name}.`);
      setOgImage(data.seoOgImage || "https://images.unsplash.com/photo-1557821552-17105176677c?w=1200&h=630&fit=crop");
      setRobotsTxt(data.seoRobotsTxt || `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /checkout/\nSitemap: https://${data.slug}.omnistore.internal/sitemap.xml`);
      setStructuredData(data.seoStructuredDataJson || JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": data.name,
        "url": data.customDomain ? `https://${data.customDomain}` : `https://${data.slug}.omnistore.internal`,
        "description": data.seoMetaDescription || `${data.name} E-Commerce Store`
      }, null, 2));

      // Load products for product SEO tab
      loadStoreProducts(data.slug);
    } catch (err) {
      console.error("Failed to load store SEO:", err);
    }
  };

  const loadStoreProducts = async (storeSlug: string) => {
    try {
      const data = await fetchApi<ProductSeoItem[]>(`/stores/${storeSlug}/products`);
      setProducts(data);
      if (data.length > 0) {
        selectProductSeo(data[0]);
      }
    } catch (err) {
      console.error("Failed to load products for SEO:", err);
    }
  };

  const selectProductSeo = (prod: ProductSeoItem) => {
    setSelectedProductId(prod.id);
    setProdSeoTitle(prod.seoTitle || prod.name);
    setProdSeoDesc(prod.seoDescription || prod.description || `Buy ${prod.name} at the best price.`);
    setProdUrlSlug(prod.urlSlug || prod.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    setProdOgImage(prod.ogImage || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=630&fit=crop");
    setProdCanonicalUrl(prod.canonicalUrl || "");
  };

  const handleSaveGlobalSeo = async () => {
    if (!selectedStoreId) return;
    setSaving(true);
    try {
      await fetchApi(`/seo/stores/${selectedStoreId}`, {
        method: "PATCH",
        body: JSON.stringify({
          seoSiteTitle: siteTitle,
          seoMetaDescription: metaDesc,
          seoCanonicalUrl: canonicalUrl,
          seoOgTitle: ogTitle,
          seoOgDescription: ogDesc,
          seoOgImage: ogImage,
          seoRobotsTxt: robotsTxt,
          seoStructuredDataJson: structuredData,
        }),
      });
      setToastMessage("Global SEO configurations updated successfully!");
      setTimeout(() => setToastMessage(""), 4000);
    } catch (err) {
      console.error("Failed to save SEO:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProductSeo = async () => {
    if (!selectedProductId) return;
    setSaving(true);
    try {
      await fetchApi(`/seo/products/${selectedProductId}`, {
        method: "PATCH",
        body: JSON.stringify({
          seoTitle: prodSeoTitle,
          seoDescription: prodSeoDesc,
          urlSlug: prodUrlSlug,
          ogImage: prodOgImage,
          canonicalUrl: prodCanonicalUrl,
        }),
      });
      setToastMessage("Product SEO details saved successfully!");
      setTimeout(() => setToastMessage(""), 4000);
    } catch (err) {
      console.error("Failed to save product SEO:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header Toast */}
        {toastMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Top Control Bar & Store Selector */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Select Store for SEO Management</h2>
              <p className="text-xs text-slate-400">Configure global metadata, Open Graph tags, sitemaps & JSON-LD schema</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-all"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.slug})
                </option>
              ))}
            </select>

            <button
              onClick={handleSaveGlobalSeo}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save SEO Settings"}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
          {[
            { id: "global", label: "Global Meta & Titles", icon: Search },
            { id: "og", label: "Open Graph (Social Sharing)", icon: Share2 },
            { id: "robots", label: "Sitemap & Robots.txt", icon: FileCode },
            { id: "schema", label: "Structured Data (JSON-LD)", icon: Code2 },
            { id: "products", label: "Per-Product SEO", icon: Package },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 font-medium text-sm border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-indigo-500 text-indigo-400 bg-slate-900/50"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: GLOBAL META & TITLES */}
        {activeTab === "global" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-400" />
                Global Search Metadata
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Site Title Template
                </label>
                <input
                  type="text"
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all"
                  placeholder="e.g. OmniStore | Premium Electronics & Tech"
                />
                <p className="text-xs text-slate-500 mt-1">Recommended length: 50-60 characters</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Meta Description
                </label>
                <textarea
                  rows={4}
                  value={metaDesc}
                  onChange={(e) => setMetaDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all"
                  placeholder="Describe your store for search engines..."
                />
                <p className="text-xs text-slate-500 mt-1">Recommended length: 140-160 characters</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Canonical Base URL
                </label>
                <input
                  type="text"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all"
                  placeholder="https://yourdomain.com"
                />
                <p className="text-xs text-slate-500 mt-1">Prevents duplicate content issues across multiple domain aliases</p>
              </div>
            </div>

            {/* Google Search Snippet Preview */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Google SERP Live Preview
              </h3>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-2 font-sans">
                <div className="text-xs text-emerald-400 truncate flex items-center gap-1">
                  <span>{canonicalUrl || "https://yourstore.com"}</span>
                </div>
                <div className="text-lg font-medium text-blue-400 hover:underline cursor-pointer leading-snug line-clamp-1">
                  {siteTitle || "Store Title Preview"}
                </div>
                <div className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {metaDesc || "Meta description snippet will appear here in Google search engine results pages..."}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OPEN GRAPH (OG SOCIAL SHARING) */}
        {activeTab === "og" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-400" />
                Social Media Open Graph Cards
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  OG Title (Facebook / Twitter / LinkedIn)
                </label>
                <input
                  type="text"
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  OG Description
                </label>
                <textarea
                  rows={3}
                  value={ogDesc}
                  onChange={(e) => setOgDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  OG Image Thumbnail URL (1200x630)
                </label>
                <input
                  type="text"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Social Share Preview Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-100">Social Share Preview</h3>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={ogImage || "https://images.unsplash.com/photo-1557821552-17105176677c?w=1200&h=630&fit=crop"}
                  alt="OG Preview"
                  className="w-full h-44 object-cover"
                />
                <div className="p-4 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">STORE PREVIEW</span>
                  <h4 className="font-bold text-slate-100 text-sm line-clamp-1">{ogTitle || "Store Title"}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{ogDesc || "Social share description preview."}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ROBOTS.TXT & SITEMAP */}
        {activeTab === "robots" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Robots.txt Editor */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-indigo-400" />
                  Robots.txt Editor
                </h3>
                {selectedStore && (
                  <a
                    href={`http://localhost:5000/api/seo/stores/${selectedStore.slug}/robots.txt`}
                    target="_blank"
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    View Live Robots.txt <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <textarea
                rows={10}
                value={robotsTxt}
                onChange={(e) => setRobotsTxt(e.target.value)}
                className="w-full bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500 transition-all leading-relaxed"
              />
            </div>

            {/* Dynamic XML Sitemap */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                Dynamic XML Sitemap
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                OmniStore automatically builds and updates dynamic XML sitemaps containing all store root pages, custom landing pages, and published products.
              </p>

              {selectedStore && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-semibold text-slate-300">Live Endpoint:</div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-xs text-indigo-400 break-all">
                    http://localhost:5000/api/seo/stores/{selectedStore.slug}/sitemap.xml
                  </div>
                  <a
                    href={`http://localhost:5000/api/seo/stores/${selectedStore.slug}/sitemap.xml`}
                    target="_blank"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20"
                  >
                    <ExternalLink className="w-4 h-4" /> Open Dynamic XML Sitemap
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: STRUCTURED DATA (JSON-LD SCHEMA) */}
        {activeTab === "schema" && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" />
              JSON-LD Schema.org Structured Data
            </h3>
            <p className="text-xs text-slate-400">
              Structured data helps Google understand your brand and display rich snippets (rich cards, site links, ratings).
            </p>

            <textarea
              rows={12}
              value={structuredData}
              onChange={(e) => setStructuredData(e.target.value)}
              className="w-full bg-slate-950 font-mono text-xs text-amber-300 border border-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500 transition-all leading-relaxed"
            />
          </div>
        )}

        {/* TAB 5: PER-PRODUCT SEO CONFIGURATOR */}
        {activeTab === "products" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Selector List */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                Store Products
              </h3>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {products.map((p) => {
                  const isSelected = p.id === selectedProductId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => selectProductSeo(p)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-indigo-600/10 border-indigo-500/50 text-indigo-300"
                          : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm line-clamp-1">{p.name}</div>
                        <div className="text-xs text-slate-500">${p.price.toFixed(2)}</div>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-slate-400">
                        {p.urlSlug || "auto-slug"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product SEO Form */}
            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-slate-100">Product SEO Metadata</h3>
                <button
                  onClick={handleSaveProductSeo}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  Save Product SEO
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Product SEO Title
                </label>
                <input
                  type="text"
                  value={prodSeoTitle}
                  onChange={(e) => setProdSeoTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Custom Product URL Slug
                </label>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-400 text-sm">
                  <span>/products/</span>
                  <input
                    type="text"
                    value={prodUrlSlug}
                    onChange={(e) => setProdUrlSlug(e.target.value)}
                    className="bg-transparent text-slate-100 outline-none w-full font-mono text-xs ml-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Product SEO Meta Description
                </label>
                <textarea
                  rows={3}
                  value={prodSeoDesc}
                  onChange={(e) => setProdSeoDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Product Open Graph Image URL
                </label>
                <input
                  type="text"
                  value={prodOgImage}
                  onChange={(e) => setProdOgImage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
