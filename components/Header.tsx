"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { UserCheck, Activity } from "lucide-react";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-10 text-slate-100">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 px-3 py-1.5 rounded-full text-xs font-semibold">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>System Normal</span>
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-200">{user.name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md font-bold text-sm">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      )}
    </header>
  );
}
