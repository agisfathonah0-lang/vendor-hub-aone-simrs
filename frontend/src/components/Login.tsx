import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Building2, UserCircle, LayoutDashboard, Globe, Stethoscope } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Email dan password harus diisi."); return; }
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err: any) {
      setError(err.message || "Gagal melakukan autentikasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Left Side: Branding */}
        <div className="bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Building2 size={240} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm tracking-widest uppercase mb-8">
              <Shield size={20} /> Vendor Hub v3
            </div>
            <h1 className="text-4xl font-black tracking-tighter leading-tight mb-4">
              AONE TRUST <br /> VENDOR <span className="text-blue-400">HUB</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Super Admin control panel untuk mengelola seluruh ekosistem SIMRS — multi-institusi, lisensi, dan monitoring terpusat.
            </p>
          </div>
          <div className="relative z-10 pt-12">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Hospital", icon: Building2 },
                { label: "Clinic", icon: LayoutDashboard },
                { label: "Puskesmas", icon: Globe },
                { label: "Practice", icon: Stethoscope },
              ].map((item) => (
                <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                  <item.icon size={16} className="text-blue-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Portal Super Admin</h2>
            <p className="text-slate-500 text-xs mt-1">Masuk dengan akun vendor Anda.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Vendor</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="superadmin@aone-trust.com"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs text-slate-800 placeholder-slate-400 bg-slate-50/50 transition-all" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs text-slate-800 placeholder-slate-400 bg-slate-50/50 transition-all" required />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[11px] font-semibold border border-red-100">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/10 active:scale-95 flex justify-center items-center gap-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                "Masuk ke Vendor Hub"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Shield size={14} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Demo Credentials</p>
                <p className="text-[9px] text-slate-400 font-mono italic">superadmin@aone-trust.com / Admin123!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
