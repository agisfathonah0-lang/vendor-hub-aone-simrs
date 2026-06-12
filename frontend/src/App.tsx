import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useParams } from "react-router-dom";
import { Shield, Building2, Activity, Server, Wifi, Users, CreditCard, LayoutDashboard, Globe, ChevronRight, CheckCircle, Star, Lock, Clock, Smartphone, Hospital, Stethoscope, Pill, Syringe, Phone, Mail, MapPin, MessageSquare, ArrowRight, Sparkles, Menu, X } from "lucide-react";
import { motion } from "motion/react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useSEO } from "./lib/useSEO";
import { apiFetch } from "./lib/utils";
import Login from "./components/Login";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import PublicHome from "./components/PublicHome";
import PublicDoctorSchedule from "./components/PublicDoctorSchedule";
import PublicLabResult from "./components/PublicLabResult";
import OnlineQueue from "./components/OnlineQueue";
import AdminRSDashboard from "./components/AdminRSDashboard";

function cn(...classes: any[]) { return classes.filter(Boolean).join(" "); }
const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || "/portal";

const AUDIENCE_ICONS: Record<string, React.ElementType> = {
  "Rumah Sakit": Hospital, "Klinik": Stethoscope, "Puskesmas": Building2,
  "Apotek": Pill, "Praktik Dokter": Syringe, "Multi-Institusi": Users,
};

const FEATURE_ICONS: { icon: React.ElementType; color: string; bg: string }[] = [
  { icon: Shield, color: "text-blue-600", bg: "bg-blue-50" },
  { icon: Server, color: "text-emerald-600", bg: "bg-emerald-50" },
  { icon: Wifi, color: "text-purple-600", bg: "bg-purple-50" },
  { icon: Activity, color: "text-orange-600", bg: "bg-orange-50" },
  { icon: Lock, color: "text-rose-600", bg: "bg-rose-50" },
  { icon: Globe, color: "text-indigo-600", bg: "bg-indigo-50" },
  { icon: Clock, color: "text-cyan-600", bg: "bg-cyan-50" },
  { icon: Smartphone, color: "text-teal-600", bg: "bg-teal-50" },
];

const DEFAULT_CONFIG = {
  menu: [
    { label: "Untuk Siapa", href: "#audiens" },
    { label: "Fitur", href: "#fitur" },
    { label: "Tampilan", href: "#tampilan" },
    { label: "Kontak", href: "#kontak" },
  ],
  hero: {
    badge: "Solusi SIMRS All-in-One",
    titleLine1: "Kelola Seluruh",
    titleLine2: "Institusi Kesehatan",
    titleHighlight: "dalam Satu Platform",
    subtitle: "Rumah sakit, klinik, puskesmas, apotek, dan praktik dokter — cukup satu dashboard vendor. Pantau, kendalikan, dan kembangkan ekosistem SIMRS Anda dari mana saja.",
    ctaPrimary: "Konsultasi Gratis",
    ctaSecondary: "Lihat Produk",
  },
  stats: [
    { label: "Institusi Terdaftar", value: "50+" },
    { label: "Pasien Terlayani", value: "100.000+" },
    { label: "Dokter Tersedia", value: "500+" },
    { label: "Uptime Server", value: "99.9%" },
  ],
  audiences: [
    { title: "Rumah Sakit", desc: "Manajemen penuh RS — rawat inap, IGD, farmasi, laboratorium, billing, dan rekam medis terintegrasi." },
    { title: "Klinik", desc: "Kelola jadwal dokter, antrian pasien, resep obat, dan pembayaran dalam satu sistem." },
    { title: "Puskesmas", desc: "Sistem informasi puskesmas terpadu — imunisasi, posyandu, KIA, dan pelaporan Dinkes." },
    { title: "Apotek", desc: "Manajemen stok obat, resep elektronik, pelacakan kadaluarsa, dan laporan penjualan." },
    { title: "Praktik Dokter", desc: "Solusi sederhana untuk praktik mandiri — jadwal, pasien, rekam medis, dan tagihan." },
    { title: "Multi-Institusi", desc: "Satu vendor kelola banyak tempat — data terisolasi, kontrol dari satu dashboard pusat." },
  ],
  features: [
    { title: "Keamanan Enterprise", desc: "Enkripsi scrypt, token-based auth, rate limiting tiap endpoint, dan audit log untuk setiap transaksi." },
    { title: "Multi-Tenant", desc: "Satu platform untuk kelola banyak institusi dengan isolasi data penuh." },
    { title: "Tunnel Outbound", desc: "Server RS lokal terhubung tanpa perlu port forwarding atau public IP — koneksi aman via WebSocket tunnel." },
    { title: "Monitoring 24/7", desc: "Pantau status koneksi, versi software, dan kesehatan server setiap RS secara real-time." },
    { title: "Lisensi Digital", desc: "Generate dan validasi license key dari pusat — RS tidak bisa beroperasi tanpa lisensi aktif." },
    { title: "Website Publik RS", desc: "Setiap RS dapat halaman publik sendiri — profil, jadwal dokter, cek hasil lab, dan ambil antrian online." },
    { title: "Sinkronisasi Real-Time", desc: "Jadwal dokter, hasil laboratorium, data antrian terupdate otomatis dari RS lokal ke publik." },
    { title: "Mobile Friendly", desc: "Tampilan responsif — pasien bisa akses dari HP, dokter bisa lihat jadwal dari mana saja." },
  ],
  screenshots: [
    { label: "Dashboard Vendor", desc: "Pantau semua RS dari satu layar" },
    { label: "Website RS Publik", desc: "Profil, jadwal dokter, antrian online" },
    { label: "Manajemen Lisensi", desc: "Generate & validasi license key" },
  ],
  testimonials: [
    { quote: "Setelah pindah ke AONE TRUST, manajemen rumah sakit jauh lebih efisien.", name: "dr. Andi Pratama", role: "Direktur RSUD" },
    { quote: "Fitur tunnel outbound sangat membantu. Tidak perlu repot public IP.", name: "Bambang Wijaya", role: "Kepala IT RS" },
    { quote: "License management memudahkan kami mengelola puluhan klinik.", name: "Dian Permata", role: "CEO Medika Group" },
  ],
  contact: { phone: "0812-3456-7890", email: "info@aone-trust.com", address: "Jakarta, Indonesia" },
  footer: { description: "Platform SIMRS terintegrasi untuk vendor dan institusi kesehatan di seluruh Indonesia. Keamanan enterprise, kelola banyak tempat dari satu dashboard.", copyright: "© 2026 AONE TRUST SIMRS. All rights reserved." },
};

function CountUp({ value, suffix }: { value: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const num = parseInt(value.replace(/\D/g, "")) || 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const dur = 1500;
        const step = Math.ceil(num / 60);
        const timer = setInterval(() => {
          start += step;
          if (start >= num) { start = num; clearInterval(timer); }
          setCount(start);
        }, dur / 60);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [num]);

  return <div ref={ref} className="text-3xl font-black text-slate-900">{count > 0 ? count.toLocaleString("id-ID") : value}{suffix && <span className="text-lg ml-0.5">{suffix}</span>}</div>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [cfg, setCfg] = useState<any>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    apiFetch("/api/vendor/landing-config").then(d => {
      setCfg(d && typeof d === "object" ? { ...DEFAULT_CONFIG, ...d } : DEFAULT_CONFIG);
    }).catch(() => setCfg(DEFAULT_CONFIG));
  }, []);

  const menu = cfg?.menu || DEFAULT_CONFIG.menu;
  const hero = cfg?.hero || DEFAULT_CONFIG.hero;
  const stats = cfg?.stats || DEFAULT_CONFIG.stats;
  const audiences = cfg?.audiences || DEFAULT_CONFIG.audiences;
  const features = cfg?.features || DEFAULT_CONFIG.features;
  const screenshots = cfg?.screenshots || DEFAULT_CONFIG.screenshots;
  const contact = cfg?.contact || DEFAULT_CONFIG.contact;
  const footer = cfg?.footer || DEFAULT_CONFIG.footer;

  useSEO("Platform SIMRS All-in-One", `${hero.titleLine1} ${hero.titleLine2} ${hero.titleHighlight}. ${hero.subtitle}`);

  if (!cfg) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-white">
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <img src="/icon-simrs.png" alt="AONE TRUST" className="w-9 h-9 rounded-xl object-cover" />
            <span className="font-black text-sm tracking-tight uppercase"><span className="text-blue-600">AONE</span> TRUST</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="hidden md:flex items-center gap-6">
            {menu.map((item: any, i: number) => (
              <a key={i} href={item.href} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-900">{item.label}</a>
            ))}
          </motion.div>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-2">
              {menu.map((item: any, i: number) => (
                <a key={i} href={item.href} onClick={() => setMobileMenu(false)} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-900 py-2">{item.label}</a>
              ))}
            </div>
          </div>
        )}
      </nav>

      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.5'%3E%3Cpath d='M50 50v-4h-4v4h-4v4h4v4h4v-4h4v-4h-4z'/%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="max-w-6xl mx-auto px-6 py-32 relative w-full">
          <div className="max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 rounded-full text-[9px] font-bold uppercase tracking-widest text-blue-300 mb-6 border border-blue-500/20">
                <Sparkles size={12} className="animate-pulse" /> {hero.badge}
              </div>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="text-5xl md:text-7xl font-black tracking-tighter leading-tight mb-6">
              {hero.titleLine1}<br />{hero.titleLine2}<br /><span className="text-blue-400">{hero.titleHighlight}</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="text-lg text-slate-300 max-w-xl mb-8 leading-relaxed">{hero.subtitle}</motion.p>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }} className="flex flex-wrap gap-4">
              <a href="#kontak" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 flex items-center gap-2">
                <MessageSquare size={14} /> {hero.ctaPrimary}
              </a>
              <a href="#audiens" className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all">{hero.ctaSecondary}</a>
            </motion.div>
          </div>
        </div>
      </section>

      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s: any, i: number) => {
              const num = parseInt(s.value.replace(/\D/g, ""));
              return (
                <motion.div key={i} variants={fadeUp} custom={i} className="text-center">
                  <CountUp value={s.value} />
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      <section id="audiens" className="max-w-6xl mx-auto px-6 py-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-4">Cocok untuk <span className="text-blue-600">Berbagai Institusi</span></h2>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">AONE TRUST SIMRS dirancang untuk memenuhi kebutuhan berbagai jenis fasilitas kesehatan — dari skala kecil hingga besar.</p>
          </motion.div>
          <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {audiences.map((a: any, i: number) => {
              const Icon = AUDIENCE_ICONS[a.title] || Building2;
              return (
                <motion.div key={i} variants={fadeUp} custom={i} className="group p-6 bg-white rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors"><Icon size={22} className="text-blue-600" /></div>
                  <h3 className="font-bold text-xs uppercase text-slate-900 tracking-tight mb-2">{a.title}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{a.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      <section id="fitur" className="bg-slate-50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-4">Fitur <span className="text-blue-600">Unggulan</span></h2>
              <p className="text-slate-400 text-sm max-w-2xl mx-auto">Dirancang dengan teknologi modern untuk keamanan, kecepatan, dan kemudahan pengelolaan.</p>
            </motion.div>
            <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f: any, i: number) => {
                const fi = FEATURE_ICONS[i % FEATURE_ICONS.length];
                const Icon = fi.icon;
                return (
                  <motion.div key={i} variants={fadeUp} custom={i} className="group p-6 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", fi.bg)}><Icon size={22} className={fi.color} /></div>
                    <h3 className="font-bold text-xs uppercase text-slate-900 tracking-tight mb-2">{f.title}</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{f.desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="tampilan" className="max-w-6xl mx-auto px-6 py-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-4">Lihat <span className="text-blue-600">Tampilannya</span></h2>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">Antarmuka modern, bersih, dan mudah digunakan — baik untuk admin, dokter, maupun pasien.</p>
          </motion.div>
          <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {screenshots.map((s: any, i: number) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="group">
                <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-lg mb-3 flex items-center justify-center">
                  <div className="text-center p-6">
                    <LayoutDashboard size={32} className="text-slate-600 mx-auto mb-2" />
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{s.label}</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 text-center">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <section id="kontak" className="bg-gradient-to-br from-slate-900 to-blue-900 py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.5'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="max-w-6xl mx-auto px-6 text-center relative">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full text-[9px] font-bold uppercase tracking-widest text-emerald-300 mb-6 border border-emerald-500/20">
              <MessageSquare size={12} /> Gratis — Tanpa Biaya
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">Konsultasi <span className="text-emerald-400">Gratis</span></motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-slate-300 text-sm max-w-xl mx-auto mb-10">
              Bingung memulai? Tim kami siap membantu Anda — dari konsultasi kebutuhan, demo sistem, hingga pendampingan instalasi. 
              <span className="text-emerald-400 font-bold"> Tanpa biaya dan tanpa komitmen.</span>
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="max-w-lg mx-auto bg-white/5 border border-white/10 rounded-2xl p-6 text-left">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center"><Phone size={16} className="text-white" /></div>
                  <div><div className="text-[10px] text-slate-400">Telepon</div><div className="font-bold text-sm text-white">{contact.phone}</div></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center"><Mail size={16} className="text-white" /></div>
                  <div><div className="text-[10px] text-slate-400">Email</div><div className="font-bold text-sm text-white">{contact.email}</div></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center"><MapPin size={16} className="text-white" /></div>
                  <div><div className="text-[10px] text-slate-400">Kantor</div><div className="font-bold text-sm text-white">{contact.address}</div></div>
                </div>
              </div>
              <a href={`mailto:${contact.email}`} className="mt-4 w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                <Mail size={14} /> Kirim Pesan Sekarang
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <footer className="bg-slate-950 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <motion.div variants={fadeUp}>
              <div className="flex items-center gap-3 mb-4">
                <img src="/icon-simrs.png" alt="AONE TRUST" className="w-10 h-10 rounded-xl object-cover" />
                <span className="font-black text-sm tracking-tight uppercase"><span className="text-blue-400">AONE</span> TRUST</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">{footer.description}</p>
            </motion.div>
            <motion.div variants={fadeUp}>
              <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-4">Hubungi Kami</h4>
              <div className="space-y-2 text-[10px] text-slate-500">
                <p>Telepon: {contact.phone}</p>
                <p>Email: {contact.email}</p>
                <p>{contact.address}</p>
              </div>
            </motion.div>
            <motion.div variants={fadeUp}>
              <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-4">Navigasi</h4>
              <div className="space-y-2">
                <Link to="/" className="block text-[10px] text-slate-500 hover:text-white transition-colors">Beranda</Link>
                {menu.map((item: any, i: number) => (
                  <a key={i} href={item.href} className="block text-[10px] text-slate-500 hover:text-white transition-colors">{item.label}</a>
                ))}
              </div>
            </motion.div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="border-t border-slate-800 pt-6 text-center text-[9px] text-slate-600">{footer.copyright}</motion.div>
        </div>
      </footer>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to={ADMIN_PATH} replace />;
  if (user.role !== "super_admin") return <Navigate to={ADMIN_PATH} replace />;
  return <>{children}</>;
}

function NotFound() {
  useSEO("Halaman Tidak Ditemukan", "Halaman yang Anda cari tidak ada atau telah dipindahkan.");
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="text-8xl font-black text-slate-200 mb-4">404</div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Halaman Tidak Ditemukan</h1>
        <p className="text-sm text-slate-500 mb-8">Halaman yang Anda cari tidak ada atau telah dipindahkan.</p>
        <Link to="/" className="inline-flex px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all">Kembali ke Beranda</Link>
      </div>
    </div>
  );
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { slug } = useParams();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to={slug ? `/rs/${slug}/portal` : ADMIN_PATH} replace />;
  if (!["super_admin", "admin_rs"].includes(user.role)) return <Navigate to={slug ? `/rs/${slug}/portal` : ADMIN_PATH} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/rs/:slug" element={<PublicHome />} />
          <Route path="/rs/:slug/jadwal-dokter" element={<PublicDoctorSchedule />} />
          <Route path="/rs/:slug/hasil-lab" element={<PublicLabResult />} />
          <Route path="/rs/:slug/antrian" element={<OnlineQueue />} />
          <Route path="/rs/:slug/admin" element={<AdminRoute><AdminRSDashboard /></AdminRoute>} />
          <Route path="/rs/:slug/portal" element={<Login />} />
          <Route path={ADMIN_PATH} element={<Login />} />
          <Route path="/admin/*" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
