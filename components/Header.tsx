"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { UserCheck, Activity, Menu } from "lucide-react";
import { PWAInstallButton } from "@/components/PWAInstallButton";

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export function Header({ onToggleMobileMenu }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 text-slate-100">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 px-3 py-1.5 rounded-full text-xs font-semibold">
          <Activity className="w-3.5 h-3.5 animate-pulse shrink-0" />
          <span className="hidden sm:inline">System Normal</span>
          <span className="sm:hidden">Online</span>
        </div>

        <PWAInstallButton variant="header" />
      </div>

      {user && (
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right">
            <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate max-w-[120px] sm:max-w-none">{user.name}</p>
            <p className="text-[11px] text-slate-400 hidden sm:block">{user.email}</p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md font-bold text-xs sm:text-sm shrink-0">
            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      )}
    </header>
  );
}
