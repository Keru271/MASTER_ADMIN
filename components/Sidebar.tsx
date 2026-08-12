"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Store,
  Palette,
  FolderTree,
  FileImage,
  Bell,
  Code2,
  Search,
  Settings,
  ShieldAlert,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "User Management", href: "/users", icon: Users },
    { label: "Global Stores", href: "/stores", icon: Store },
    { label: "Media Library", href: "/media", icon: FileImage },
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "Developer API", href: "/developer", icon: Code2 },
    { label: "Marketplace Themes", href: "/templates", icon: Palette },
    { label: "Store Categories", href: "/categories", icon: FolderTree },
    { label: "SEO Governance", href: "/seo", icon: Search },
    { label: "System Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen text-slate-300">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-lg tracking-tight">CMS Admin</h1>
            <p className="text-xs text-indigo-400 font-medium">Master Control Panel</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
