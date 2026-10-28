"use client";

import React, { useState } from "react";
import { RotateCw } from "lucide-react";

export interface TableRefreshButtonProps {
  onRefresh: () => void | Promise<any>;
  isLoading?: boolean;
  isRefreshing?: boolean;
  label?: string;
  iconOnly?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export const TableRefreshButton: React.FC<TableRefreshButtonProps> = ({
  onRefresh,
  isLoading = false,
  isRefreshing = false,
  label = "Refresh",
  iconOnly = false,
  className = "",
  size = "md",
}) => {
  const [internalLoading, setInternalLoading] = useState(false);

  const activeLoading = isLoading || isRefreshing || internalLoading;

  const handleClick = async () => {
    if (activeLoading) return;
    try {
      const res = onRefresh();
      if (res && typeof (res as any).then === "function") {
        setInternalLoading(true);
        await res;
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const isSmall = size === "sm";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={activeLoading}
      title={label}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
        isSmall ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
      } ${className}`}
    >
      <RotateCw
        className={`${isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} text-slate-400 ${
          activeLoading ? "animate-spin text-indigo-400" : ""
        }`}
      />
      {!iconOnly && <span>{activeLoading ? "Refreshing..." : label}</span>}
    </button>
  );
};
