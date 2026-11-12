"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  Users,
  Store,
  CreditCard,
  Palette,
  Bell,
  Settings,
  ShieldAlert,
  HelpCircle,
  LogOut,
  X,
  ChevronDown,
  GitBranch,
  Rocket,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PWAInstallButton } from "@/components/PWAInstallButton";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavBranchGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const directItem: NavItem = {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  };

  const branchGroups: NavBranchGroup[] = [
    {
      id: "governance",
      label: "Governance & Stores",
      icon: Store,
      items: [
        { label: "Global Stores", href: "/stores", icon: Store },
        { label: "User Management", href: "/users", icon: Users },
        { label: "Appeals & Inquiries", href: "/queries", icon: HelpCircle },
        { label: "Ping Status", href: "/ping", icon: Activity },
      ],
    },
    {
      id: "platform",
      label: "Platform Ecosystem",
      icon: Settings,
      items: [
        { label: "Pricing Tiers", href: "/pricing", icon: CreditCard },
        { label: "Marketplace Themes", href: "/templates", icon: Palette },
        { label: "Deployments Hub", href: "/deployments", icon: Rocket },
        { label: "Notifications", href: "/notifications", icon: Bell },
        { label: "System Settings", href: "/settings", icon: Settings },
      ],
    },
  ];

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    governance: true,
    platform: true,
  });

  // Auto-expand group if on a child route
  useEffect(() => {
    branchGroups.forEach((group) => {
      const hasActiveChild = group.items.some((item) =>
        item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
      );
      if (hasActiveChild) {
        setOpenSections((prev) => ({ ...prev, [group.id]: true }));
      }
    });
  }, [pathname]);

  const handleLinkClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const isItemActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
        />
      )}

      <aside
        className={`bg-slate-900 border-r border-slate-800 flex flex-col justify-between text-slate-300 transition-all duration-300 z-50 ${mobileOpen
            ? "fixed inset-y-0 left-0 w-72 shadow-2xl flex"
            : "hidden lg:flex w-64 h-screen shrink-0 sticky top-0"
          }`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Brand Header */}
          <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white p-2 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-slate-100 text-lg tracking-tight">CMS Admin</h1>
                <p className="text-xs text-indigo-400 font-medium">Master Control Panel</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            {mobileOpen && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                aria-label="Close Sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-2 overflow-y-auto flex-1 scrollbar-thin">
            {/* Direct Dashboard Link */}
            {(() => {
              const Icon = directItem.icon;
              const isActive = isItemActive(directItem.href);
              return (
                <Link
                  href={directItem.href}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-semibold"
                      : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  {directItem.label}
                </Link>
              );
            })()}

            {/* Branch Header Strip */}
            <div className="pt-3 pb-1 px-1">
              <div className="flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  System Branches
                </span>
              </div>
            </div>

            {/* Branched Groups */}
            {branchGroups.map((group) => {
              const GroupIcon = group.icon;
              const isGroupActive = group.items.some((item) => isItemActive(item.href));
              const isOpen = !!openSections[group.id];

              return (
                <div key={group.id} className="space-y-1">
                  {/* Group Header Button */}
                  <button
                    onClick={() =>
                      setOpenSections((prev) => ({
                        ...prev,
                        [group.id]: !prev[group.id],
                      }))
                    }
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${isGroupActive
                        ? "bg-slate-800/80 text-white font-semibold"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <GroupIcon
                        className={`w-4 h-4 ${isGroupActive ? "text-indigo-400" : "text-slate-400"
                          }`}
                      />
                      <span className="truncate">{group.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {group.items.length}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180 text-slate-300" : "text-slate-500"
                          }`}
                      />
                    </div>
                  </button>

                  {/* Branched Tree Items */}
                  {isOpen && (
                    <div className="relative pl-3 ml-3 pt-0.5 pb-1 space-y-0.5 animate-in slide-in-from-top-1 duration-150">
                      {group.items.map((item, idx) => {
                        const ItemIcon = item.icon;
                        const isChildActive = isItemActive(item.href);
                        const isLast = idx === group.items.length - 1;

                        return (
                          <div
                            key={item.href}
                            className="relative group/leaf flex items-center min-h-[32px]"
                          >
                            {/* Vertical trunk line */}
                            <div
                              className={`absolute left-[7px] top-0 pointer-events-none transition-colors duration-200 ${isLast ? "h-[16px]" : "h-full"
                                } w-[1.5px] ${isChildActive
                                  ? "bg-indigo-500"
                                  : "bg-slate-800 group-hover/leaf:bg-slate-700"
                                }`}
                            />

                            {/* Curved horizontal elbow connector */}
                            <div
                              className={`absolute left-[7px] top-[16px] w-[14px] h-[1.5px] pointer-events-none transition-colors duration-200 ${isChildActive
                                  ? "bg-indigo-500"
                                  : "bg-slate-800 group-hover/leaf:bg-slate-700"
                                }`}
                            />

                            {/* Branch leaf node dot */}
                            <div
                              className={`absolute left-[19px] top-[13.5px] w-1.5 h-1.5 rounded-full pointer-events-none transition-all duration-200 z-10 ${isChildActive
                                  ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.9)] scale-125"
                                  : "bg-slate-700 group-hover/leaf:bg-indigo-400"
                                }`}
                            />

                            {/* Clickable Nav Link */}
                            <Link
                              href={item.href}
                              onClick={handleLinkClick}
                              className={`w-full ml-[26px] flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${isChildActive
                                  ? "bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30"
                                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                                }`}
                            >
                              <ItemIcon
                                className={`w-3.5 h-3.5 shrink-0 ${isChildActive ? "text-indigo-400" : "text-slate-500"
                                  }`}
                              />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-800 space-y-2 shrink-0">
          <PWAInstallButton variant="sidebar" />
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
