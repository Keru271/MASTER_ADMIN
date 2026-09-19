"use client";

import React, { useState } from "react";
import { usePWA } from "@/context/PWAContext";
import { Download, CheckCircle2, Share2, Smartphone, Monitor, X } from "lucide-react";

export function PWAInstallButton({ variant = "header" }: { variant?: "header" | "sidebar" }) {
  const { isInstalled, canInstall, installPWA } = usePWA();
  const [showModal, setShowModal] = useState(false);
  const [installing, setInstalling] = useState(false);

  const handleInstallClick = async () => {
    if (canInstall) {
      setInstalling(true);
      await installPWA();
      setInstalling(false);
    } else {
      // If browser doesn't expose beforeinstallprompt (e.g., iOS Safari or already prompted), show guidance modal
      setShowModal(true);
    }
  };

  if (isInstalled && variant === "header") {
    return (
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/60 text-slate-300 text-xs font-medium">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>Desktop App</span>
      </div>
    );
  }

  if (variant === "sidebar") {
    if (isInstalled) {
      return (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-slate-400 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-300">Installed Mode</p>
            <p className="text-[10px] text-slate-500">Standalone Console</p>
          </div>
        </div>
      );
    }

    return (
      <>
        <button
          onClick={handleInstallClick}
          disabled={installing}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/50 hover:bg-indigo-900/50 hover:border-indigo-700/60 text-indigo-300 hover:text-indigo-200 transition-all text-xs font-medium cursor-pointer group"
          aria-label="Install Master Admin App"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
            <Download className="w-3.5 h-3.5" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="font-semibold text-slate-200 truncate">Install App</p>
            <p className="text-[10px] text-indigo-400 truncate">Desktop & Mobile PWA</p>
          </div>
        </button>

        {showModal && <InstallGuideModal onClose={() => setShowModal(false)} />}
      </>
    );
  }

  // Header Variant
  return (
    <>
      <button
        onClick={handleInstallClick}
        disabled={installing}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-300 text-xs font-medium transition-all cursor-pointer shadow-sm"
        title="Install Master Admin as Progressive Web App"
      >
        <Download className="w-3.5 h-3.5 text-indigo-400" />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">PWA</span>
      </button>

      {showModal && <InstallGuideModal onClose={() => setShowModal(false)} />}
    </>
  );
}

function InstallGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-200 space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Install Master Admin</h3>
            <p className="text-xs text-slate-400">Run as a standalone desktop or mobile application</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
              <Monitor className="w-4 h-4" />
              <span>Chrome / Edge / Brave (Desktop)</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Click the <strong className="text-slate-200 font-medium">Install icon</strong> in the right corner of your browser address bar, or click Menu (⋮) &rarr; <span className="text-slate-200 font-medium">"Install Master Admin"</span>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
              <Share2 className="w-4 h-4" />
              <span>Safari / iOS</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Tap the <strong className="text-slate-200 font-medium">Share button</strong> (square with arrow) in Safari bottom bar, then tap <span className="text-slate-200 font-medium">"Add to Home Screen"</span>.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
