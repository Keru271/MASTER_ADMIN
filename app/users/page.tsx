"use client";

import React, { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import {
  Users,
  Search,
  ShieldCheck,
  CheckCircle,
  XCircle,
  RefreshCw,
  Crown,
  Briefcase,
  Edit3,
  Headphones,
  Check,
  X,
  Save,
  CheckCircle2,
} from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | "SUPPORT" | "MERCHANT" | "CUSTOMER";
  customRoleTitle?: string;
  permissionsProducts: boolean;
  permissionsOrders: boolean;
  permissionsCustomers: boolean;
  permissionsThemes: boolean;
  permissionsSettings: boolean;
  permissionsPayments: boolean;
  permissionsAnalytics: boolean;
  emailVerified: boolean;
  createdAt: string;
  _count: {
    stores: number;
  };
}

const ROLE_PRESETS: Record<string, { title: string; permissions: Record<string, boolean> }> = {
  OWNER: {
    title: "Store Owner",
    permissions: {
      permissionsProducts: true,
      permissionsOrders: true,
      permissionsCustomers: true,
      permissionsThemes: true,
      permissionsSettings: true,
      permissionsPayments: true,
      permissionsAnalytics: true,
    },
  },
  ADMIN: {
    title: "Administrator",
    permissions: {
      permissionsProducts: true,
      permissionsOrders: true,
      permissionsCustomers: true,
      permissionsThemes: true,
      permissionsSettings: true,
      permissionsPayments: true,
      permissionsAnalytics: true,
    },
  },
  MANAGER: {
    title: "Store Manager",
    permissions: {
      permissionsProducts: true,
      permissionsOrders: true,
      permissionsCustomers: true,
      permissionsThemes: true,
      permissionsSettings: false,
      permissionsPayments: false,
      permissionsAnalytics: true,
    },
  },
  EDITOR: {
    title: "Content Editor",
    permissions: {
      permissionsProducts: true,
      permissionsOrders: false,
      permissionsCustomers: false,
      permissionsThemes: true,
      permissionsSettings: false,
      permissionsPayments: false,
      permissionsAnalytics: false,
    },
  },
  SUPPORT: {
    title: "Support Agent",
    permissions: {
      permissionsProducts: false,
      permissionsOrders: true,
      permissionsCustomers: true,
      permissionsThemes: false,
      permissionsSettings: false,
      permissionsPayments: false,
      permissionsAnalytics: false,
    },
  },
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);

      const data = await fetchApi<UserItem[]>(`/api/admin/users?${params.toString()}`);
      setUsers(data);
      if (data.length > 0 && !selectedUser) {
        setSelectedUser(data[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load user accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleApplyPreset = (presetRole: string) => {
    if (!selectedUser) return;
    const preset = ROLE_PRESETS[presetRole];
    if (!preset) return;

    setSelectedUser({
      ...selectedUser,
      role: presetRole as any,
      customRoleTitle: preset.title,
      ...preset.permissions,
    } as any);
  };

  const handleSaveUserPermissions = async () => {
    if (!selectedUser) return;
    setSavingUser(true);
    try {
      await fetchApi(`/api/admin/users/${selectedUser.id}/role`, {
        method: "PATCH",
        body: JSON.stringify({
          role: selectedUser.role,
          customRoleTitle: selectedUser.customRoleTitle,
          permissionsProducts: selectedUser.permissionsProducts,
          permissionsOrders: selectedUser.permissionsOrders,
          permissionsCustomers: selectedUser.permissionsCustomers,
          permissionsThemes: selectedUser.permissionsThemes,
          permissionsSettings: selectedUser.permissionsSettings,
          permissionsPayments: selectedUser.permissionsPayments,
          permissionsAnalytics: selectedUser.permissionsAnalytics,
        }),
      });

      setToastMessage(`Updated permissions matrix for ${selectedUser.name}!`);
      setTimeout(() => setToastMessage(""), 4000);
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to update user role.");
    } finally {
      setSavingUser(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return Crown;
      case "ADMIN":
        return ShieldCheck;
      case "MANAGER":
        return Briefcase;
      case "EDITOR":
        return Edit3;
      case "SUPPORT":
        return Headphones;
      default:
        return Users;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-indigo-400" />
            <span>Multi-User Access & Fine-Grained RBAC Governance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage multi-user store staff roles (Owner, Admin, Manager, Editor, Support) & explicit feature access permissions.
          </p>
        </div>
        <button
          onClick={loadUsers}
          className="self-start md:self-auto flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-sm font-medium border border-slate-700 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Reload Accounts</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search accounts by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold"
        >
          <option value="">All Roles</option>
          <option value="OWNER">Owner 👑</option>
          <option value="ADMIN">Admin 🛡️</option>
          <option value="MANAGER">Manager 💼</option>
          <option value="EDITOR">Editor ✍️</option>
          <option value="SUPPORT">Support 🎧</option>
          <option value="MERCHANT">Merchant</option>
        </select>
      </div>

      {/* Main Grid: User List + Role & Permissions Configurator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* User Table List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 uppercase text-xs text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-4 px-5">User Account</th>
                  <th className="py-4 px-5">Assigned Role</th>
                  <th className="py-4 px-5">Permissions Matrix</th>
                  <th className="py-4 px-5 text-right">Configure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  const RoleIcon = getRoleIcon(u.role);
                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-indigo-600/10 border-l-4 border-indigo-500" : "hover:bg-slate-800/40"
                      }`}
                    >
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-100">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-950 border border-slate-800 text-slate-200">
                          <RoleIcon className="w-3.5 h-3.5 text-indigo-400" />
                          {u.customRoleTitle || u.role}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <span className={u.permissionsProducts ? "text-emerald-400 font-bold" : "text-slate-600"}>P</span>
                          <span className={u.permissionsOrders ? "text-emerald-400 font-bold" : "text-slate-600"}>O</span>
                          <span className={u.permissionsCustomers ? "text-emerald-400 font-bold" : "text-slate-600"}>C</span>
                          <span className={u.permissionsThemes ? "text-emerald-400 font-bold" : "text-slate-600"}>T</span>
                          <span className={u.permissionsSettings ? "text-emerald-400 font-bold" : "text-slate-600"}>S</span>
                          <span className={u.permissionsPayments ? "text-emerald-400 font-bold" : "text-slate-600"}>$</span>
                          <span className={u.permissionsAnalytics ? "text-emerald-400 font-bold" : "text-slate-600"}>A</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                        >
                          Manage Permissions
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected User Permissions Inspector & Editor */}
        {selectedUser ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-slate-100 text-base">{selectedUser.name}</h3>
                <p className="text-xs text-slate-400">{selectedUser.email}</p>
              </div>

              <button
                onClick={handleSaveUserPermissions}
                disabled={savingUser}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {savingUser ? "Saving..." : "Save RBAC"}
              </button>
            </div>

            {/* Quick Role Presets Buttons */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Quick Role Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {["OWNER", "ADMIN", "MANAGER", "EDITOR", "SUPPORT"].map((presetRole) => (
                  <button
                    key={presetRole}
                    onClick={() => handleApplyPreset(presetRole)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all cursor-pointer"
                  >
                    {presetRole}
                  </button>
                ))}
              </div>
            </div>

            {/* Fine-Grained Permissions Checkbox Matrix */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Access Permissions Matrix</h4>

              {[
                { key: "permissionsProducts", label: "Products Catalog", desc: "Add, edit & delete products", req: "✓ Required for Manager & Editor" },
                { key: "permissionsOrders", label: "Order Management", desc: "Fulfill orders, view invoices & tracking", req: "✓ Required for Manager & Support" },
                { key: "permissionsCustomers", label: "Customer Accounts", desc: "View customer profiles & address history", req: "✓ Required for Manager & Support" },
                { key: "permissionsThemes", label: "Themes & Layouts", desc: "Customize storefront templates & styles", req: "✓ Required for Manager & Editor" },
                { key: "permissionsSettings", label: "Store Settings", desc: "Modify store configuration & business details", req: "✗ Manager Restricted" },
                { key: "permissionsPayments", label: "Payments & Gateways", desc: "Configure payment gateways & payouts", req: "✗ Manager Restricted" },
                { key: "permissionsAnalytics", label: "Analytics & Reports", desc: "View store sales, conversion & traffic metrics", req: "✓ Required for Manager" },
              ].map((perm) => {
                const isChecked = (selectedUser as any)[perm.key];
                return (
                  <label
                    key={perm.key}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      isChecked ? "bg-slate-950 border-slate-700" : "bg-slate-950/40 border-slate-900 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isChecked ? "text-slate-100" : "text-slate-500"}`}>{perm.label}</span>
                        <span className={`text-[10px] font-mono ${isChecked ? "text-emerald-400" : "text-rose-400 font-semibold"}`}>
                          {isChecked ? "✓ ALLOWED" : "✗ BLOCKED"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">{perm.desc}</div>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => setSelectedUser({ ...selectedUser, [perm.key]: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-500 text-sm">
            Select a user account to configure role permissions.
          </div>
        )}

      </div>
    </div>
  );
}
