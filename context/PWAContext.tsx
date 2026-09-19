"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAContextType {
  isInstalled: boolean;
  canInstall: boolean;
  isOnline: boolean;
  installPWA: () => Promise<boolean>;
  swRegistration: ServiceWorkerRegistration | null;
}

const PWAContext = createContext<PWAContextType>({
  isInstalled: false,
  canInstall: false,
  isOnline: true,
  installPWA: async () => false,
  swRegistration: null,
});

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check initial online status
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);

      // Check if already running in standalone mode (installed PWA)
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes("android-app://");

      if (isStandalone) {
        setIsInstalled(true);
      }

      // Connectivity listeners
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Listen for browser install prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setCanInstall(true);
      };

      // Listen for successful installation
      const handleAppInstalled = () => {
        setIsInstalled(true);
        setCanInstall(false);
        setDeferredPrompt(null);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.addEventListener("appinstalled", handleAppInstalled);

      // Register Service Worker
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            setSwRegistration(registration);
          })
          .catch((error) => {
            console.warn("Service Worker registration failed:", error);
          });
      }

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }
  }, []);

  const installPWA = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        setCanInstall(false);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.error("Error triggering install prompt:", err);
    }
    return false;
  }, [deferredPrompt]);

  return (
    <PWAContext.Provider
      value={{
        isInstalled,
        canInstall,
        isOnline,
        installPWA,
        swRegistration,
      }}
    >
      {/* Network Disconnected Notification Banner */}
      {!isOnline && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300 px-4 py-2 text-xs flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
            <span className="font-semibold">Offline Mode</span>
            <span className="text-amber-400/80 hidden sm:inline">— Running with cached administration resources. Changes will sync when network is restored.</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-[11px] underline hover:text-amber-200 transition-colors font-medium cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  return useContext(PWAContext);
}
