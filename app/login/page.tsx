"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, Loader2, UserPlus, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@cms");
  const [password, setPassword] = useState("Admin123!@#");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [provisionSuccess, setProvisionSuccess] = useState<string | null>(null);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProvisionSuccess(null);
    setSubmitting(true);

    try {
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to log in as Master Admin.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddUser = async () => {
    setError(null);
    setProvisionSuccess(null);
    setProvisioning(true);

    const targetEmail = "admin@cms";
    const targetPassword = "Admin123!@#";

    try {
      const data = await fetchApi("/api/users/provision-admin", {
        method: "POST",
        body: JSON.stringify({
          email: targetEmail,
          password: targetPassword,
          name: "Master Admin",
        }),
      });

      setEmail(targetEmail);
      setPassword(targetPassword);
      setProvisionSuccess(data.message || `User ${targetEmail} added successfully.`);
    } catch (err: any) {
      setError(err.message || "Failed to add Master Admin user.");
    } finally {
      setProvisioning(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans text-slate-100">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Master Admin Login</h1>
          <p className="text-sm text-slate-400 mt-1">Authenticate to access CMS platform management</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-sm flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {provisionSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-sm flex items-start gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">User Added Successfully!</p>
              <p className="text-xs text-emerald-400/90 mt-0.5">
                Master Admin user <strong>admin@cms</strong> with password <strong>Admin123!@#</strong> is ready. Click "Sign In to Dashboard" below to log in.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-mono"
                placeholder="admin@cms"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-mono"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || provisioning}
            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Button to Add User in Master Admin */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-3">
          <button
            type="button"
            onClick={handleAddUser}
            disabled={provisioning || submitting}
            className="w-full bg-slate-800/90 hover:bg-slate-800 border border-indigo-500/40 hover:border-indigo-500 text-indigo-300 hover:text-white font-semibold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider"
          >
            {provisioning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Adding Master Admin User...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span>Add User (admin@cms / Admin123!@#)</span>
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-slate-500">
            Creates or resets master admin user <code className="text-indigo-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">admin@cms</code> with password <code className="text-indigo-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">Admin123!@#</code>
          </p>
        </div>
      </div>
    </div>
  );
}
