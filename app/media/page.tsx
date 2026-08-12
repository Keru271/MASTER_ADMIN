"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { fetchApi } from "@/lib/api";
import {
  FileImage,
  Search,
  Upload,
  Copy,
  Check,
  Trash2,
  FileText,
  Video,
  Type,
  Image as ImageIcon,
  Folder,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface MediaItem {
  id: string;
  fileName: string;
  originalName: string;
  fileType: string;
  folder: string;
  mimeType: string;
  size: number;
  dimensions?: string;
  url: string;
  cdnUrl: string;
  format: string;
  tags?: string;
  createdAt: string;
}

interface MediaFolder {
  folder: string;
  count: number;
  totalBytes: number;
}

export default function MediaLibraryPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedFolder, setSelectedFolder] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadFolder, setUploadFolder] = useState("/products");
  const [uploadType, setUploadType] = useState("PRODUCT_IMAGE");
  const [uploadFormat, setUploadFormat] = useState("webp");
  const [uploadTags, setUploadTags] = useState("");
  const [uploading, setUploading] = useState(false);

  // Copy Feedback State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadMedia();
    loadFolders();
  }, [selectedType, selectedFolder, searchQuery]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== "ALL") params.append("fileType", selectedType);
      if (selectedFolder !== "ALL") params.append("folder", selectedFolder);
      if (searchQuery) params.append("search", searchQuery);

      const data = await fetchApi<MediaItem[]>(`/media?${params.toString()}`);
      setMediaFiles(data);
    } catch (err) {
      console.error("Failed to load media files:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const data = await fetchApi<MediaFolder[]>("/media/folders");
      setFolders(data);
    } catch (err) {
      console.error("Failed to load folders:", err);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName) return;

    setUploading(true);
    try {
      await fetchApi("/media/upload", {
        method: "POST",
        body: JSON.stringify({
          fileName: uploadFileName,
          fileType: uploadType,
          folder: uploadFolder,
          url: uploadUrl || undefined,
          format: uploadFormat,
          tags: uploadTags,
        }),
      });

      setShowUploadModal(false);
      setUploadFileName("");
      setUploadUrl("");
      setUploadTags("");
      loadMedia();
      loadFolders();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media asset?")) return;
    try {
      await fetchApi(`/media/${id}`, { method: "DELETE" });
      loadMedia();
      loadFolders();
    } catch (err) {
      console.error("Failed to delete media asset:", err);
    }
  };

  const handleCopyCdnUrl = (cdnUrl: string, id: string) => {
    navigator.clipboard.writeText(cdnUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
              <FileImage className="w-7 h-7 text-indigo-400" />
              <span>Centralized Media & Assets Library</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Store product imagery, banner assets, videos, custom typography fonts & documents with WebP/AVIF CDN optimization.
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="self-start md:self-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload New Media Asset</span>
          </button>
        </div>

        {/* Filters & Folder Sidebar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Folder Organization Navigation */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Folder className="w-4 h-4 text-indigo-400" />
              Folder Hierarchy
            </h3>

            <div className="space-y-1">
              {[
                { label: "All Asset Folders", value: "ALL", icon: Layers, count: mediaFiles.length },
                { label: "Product Imagery", value: "/products", icon: ImageIcon, count: folders.find(f => f.folder === "/products")?.count || 0 },
                { label: "Hero Banners", value: "/banners", icon: Sparkles, count: folders.find(f => f.folder === "/banners")?.count || 0 },
                { label: "Promo Videos", value: "/videos", icon: Video, count: folders.find(f => f.folder === "/videos")?.count || 0 },
                { label: "Custom Fonts (WOFF2)", value: "/fonts", icon: Type, count: folders.find(f => f.folder === "/fonts")?.count || 0 },
                { label: "Policy Documents", value: "/documents", icon: FileText, count: folders.find(f => f.folder === "/documents")?.count || 0 },
              ].map((f) => {
                const Icon = f.icon;
                const isSelected = selectedFolder === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setSelectedFolder(f.value)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{f.label}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${isSelected ? "bg-indigo-700 text-white" : "bg-slate-800 text-slate-400"}`}>
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Asset Format Filter */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Format Filter</h4>
              <div className="flex flex-wrap gap-1.5">
                {["ALL", "PRODUCT_IMAGE", "BANNER_IMAGE", "VIDEO", "FONT", "DOCUMENT"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                      selectedType === type
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {type === "ALL" ? "All Formats" : type.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Media Grid & Search Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search media assets by file name, tag keywords, format, or folder..."
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
              />
            </div>

            {/* Media Asset Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {mediaFiles.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between group shadow-lg"
                >
                  {/* Media Preview Box */}
                  <div className="relative h-40 bg-slate-950 border-b border-slate-800 flex items-center justify-center overflow-hidden">
                    {item.fileType.includes("IMAGE") ? (
                      <img
                        src={item.url}
                        alt={item.fileName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                      />
                    ) : item.fileType === "VIDEO" ? (
                      <video src={item.url} className="w-full h-full object-cover" muted loop autoPlay />
                    ) : item.fileType === "FONT" ? (
                      <div className="text-center space-y-1">
                        <Type className="w-10 h-10 text-amber-400 mx-auto" />
                        <span className="text-xs font-mono text-slate-400">WOFF2 Typography</span>
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <FileText className="w-10 h-10 text-indigo-400 mx-auto" />
                        <span className="text-xs font-mono text-slate-400">PDF Document</span>
                      </div>
                    )}

                    {/* Format Badge */}
                    <span className="absolute top-2.5 left-2.5 bg-slate-900/90 border border-slate-700 text-slate-200 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md uppercase backdrop-blur-md">
                      {item.format}
                    </span>

                    {/* WebP / AVIF Optimization Badge */}
                    {(item.format === "webp" || item.format === "avif") && (
                      <span className="absolute top-2.5 right-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md uppercase backdrop-blur-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        CDN WebP
                      </span>
                    )}
                  </div>

                  {/* Info Details */}
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="font-semibold text-slate-100 text-xs truncate" title={item.fileName}>
                        {item.fileName}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                        <span>{item.folder}</span>
                        <span>•</span>
                        <span>{formatFileSize(item.size)}</span>
                        {item.dimensions && (
                          <>
                            <span>•</span>
                            <span>{item.dimensions}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Copy CDN URL & Actions */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleCopyCdnUrl(item.cdnUrl, item.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-indigo-600/20 hover:text-indigo-300 text-slate-300 text-[11px] font-medium py-1.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">CDN URL Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copy CDN URL</span>
                          </>
                        )}
                      </button>

                      <a
                        href={item.url}
                        target="_blank"
                        className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 rounded-xl transition-all"
                        title="View Asset"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-rose-400 hover:bg-rose-950/40 border border-slate-700 rounded-xl transition-all cursor-pointer"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-400" />
                  Upload & Optimize Media Asset
                </h3>
                <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-200 text-sm">
                  ✕
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    File Name
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadFileName}
                    onChange={(e) => setUploadFileName(e.target.value)}
                    placeholder="e.g. spring-collection-banner.webp"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Target Folder
                    </label>
                    <select
                      value={uploadFolder}
                      onChange={(e) => setUploadFolder(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="/products">/products</option>
                      <option value="/banners">/banners</option>
                      <option value="/videos">/videos</option>
                      <option value="/fonts">/fonts</option>
                      <option value="/documents">/documents</option>
                      <option value="/uploads">/uploads</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Asset Category
                    </label>
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="PRODUCT_IMAGE">Product Image</option>
                      <option value="BANNER_IMAGE">Banner Image</option>
                      <option value="VIDEO">Video</option>
                      <option value="FONT">Font</option>
                      <option value="DOCUMENT">Document</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    CDN Optimization Format
                  </label>
                  <select
                    value={uploadFormat}
                    onChange={(e) => setUploadFormat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="webp">WebP (Next-Gen Compressed)</option>
                    <option value="avif">AVIF (Ultra-High Compression)</option>
                    <option value="png">PNG (Lossless Alpha)</option>
                    <option value="jpg">JPG (Standard)</option>
                    <option value="mp4">MP4 (Video)</option>
                    <option value="woff2">WOFF2 (Font)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Asset Source URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-all"
                  >
                    {uploading ? "Optimizing..." : "Upload Asset"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
