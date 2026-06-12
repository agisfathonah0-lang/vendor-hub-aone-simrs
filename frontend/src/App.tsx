import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { Shield, Building2, Activity, ArrowRight, Server, Wifi, Users, CreditCard, LayoutDashboard, Globe, ChevronRight } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import PublicHome from "./components/PublicHome";
import PublicDoctorSchedule from "./components/PublicDoctorSchedule";
import PublicLabResult from "./components/PublicLabResult";
import OnlineQueue from "./components/OnlineQueue";
import { apiFetch, cn, getInitials } from "./lib/utils";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sinkronisasi Sesi...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "super_admin") return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LandingPage() {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      try { setInstitutions(await apiFetch("/api/public/institutions")); } catch {}
    })();
  }, []);
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center"><Shield size={20} className="text-white" /></div>
            <div>
              <h1 className="font-black text-lg tracking-tight uppercase">AONE TRUST <span className="text-blue-400">HUB</span></h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Vendor Control Center v3</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={user ? "/admin" : "/login"} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2">
              {user ? <LayoutDashboard size={12} /> : <Shield size={12} />} {user ? "Dashboard" : "Login Super Admin"}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Platform Manajemen SIMRS</h2>
          <p className="text-slate-500 text-sm max-w-2xl mx-auto">Vendor Hub untuk mengelola seluruh instansi rumah sakit, klinik, puskesmas, apotek, dan praktik dokter dalam satu ekosistem terpadu dengan monitoring real-time.</p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <Link to="/login" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2">
              Mulai Sekarang <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {institutions.length > 0 && (
          <div className="mb-16">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Building2 size={12} /> Institusi Terdaftar</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {institutions.map((inst: any) => (
                <div key={inst.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between group hover:shadow-md transition-all cursor-pointer"
                  onClick={() => window.location.href = `/rs/${inst.url_slug}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-white text-[10px] font-bold">{getInitials(inst.name)}</div>
                    <div>
                      <div className="font-bold text-xs uppercase tracking-tight text-slate-900">{inst.name}</div>
                      <div className="text-[8px] text-slate-400 mt-0.5">{inst.city || "-"} &middot; <span className="uppercase">{inst.type}</span></div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: Building2, title: "Multi-Tenant", desc: "Kelola banyak RS dari satu panel super admin dengan isolasi data per institusi.", color: "text-blue-600", bg: "bg-blue-50" },
            { icon: Server, title: "Tunnel Real-Time", desc: "Setiap RS terhubung via tunnel WebSocket outbound — tanpa perlu port forwarding atau public IP.", color: "text-emerald-600", bg: "bg-emerald-50" },
            { icon: Shield, title: "Keamanan Terpusat", desc: "Manajemen user, lisensi, dan akses dari vendor hub dengan enkripsi scrypt.", color: "text-purple-600", bg: "bg-purple-50" },
            { icon: Activity, title: "Monitoring Langsung", desc: "Pantau status koneksi, versi software, dan kesehatan server setiap RS secara real-time.", color: "text-orange-600", bg: "bg-orange-50" },
            { icon: CreditCard, title: "Lisensi & Tagihan", desc: "Atur plan, masa aktif, dan harga langganan per institusi dari panel terpusat.", color: "text-cyan-600", bg: "bg-cyan-50" },
            { icon: Globe, title: "Website RS", desc: "Setiap RS mendapat halaman publik sendiri (profil, jadwal dokter, hasil lab, antrian online).", color: "text-indigo-600", bg: "bg-indigo-50" },
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-4", item.bg)}><item.icon size={20} className={item.color} /></div>
              <h3 className="font-bold text-xs uppercase text-slate-900 tracking-tight mb-2">{item.title}</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 rounded-2xl p-8 text-center">
          <h3 className="text-white font-black text-lg uppercase tracking-tight mb-2">Siap Mengelola RS Anda?</h3>
          <p className="text-slate-400 text-sm mb-6">Login sebagai Super Admin untuk memulai konfigurasi vendor hub.</p>
          <Link to="/login" className="inline-flex px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all items-center gap-2">
            Masuk ke Vendor Hub <ArrowRight size={14} />
          </Link>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">
        AONE TRUST SIMRS Hub v3 &copy; 2026
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/rs/:slug" element={<PublicHome />} />
          <Route path="/rs/:slug/jadwal-dokter" element={<PublicDoctorSchedule />} />
          <Route path="/rs/:slug/hasil-lab" element={<PublicLabResult />} />
          <Route path="/rs/:slug/antrian" element={<OnlineQueue />} />
          <Route path="/admin/*" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
