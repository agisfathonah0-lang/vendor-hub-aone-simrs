import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Building2, Users, CreditCard, Puzzle, Activity, Megaphone,
  FileSpreadsheet, Database, LifeBuoy, Plus, Search, X, ChevronRight, ShieldCheck,
  Server, DollarSign, Clock, CheckCircle, CheckCircle2,   Edit3, Lock, Unlock, UserPlus, Zap,
  RefreshCw, MapPin, Globe, Filter, AlertTriangle, BarChart3, MessageSquare,
  Wifi, WifiOff, Sliders, Copy, MoreVertical, Play, Pause, Ban, Calendar,
  ToggleLeft, ToggleRight, Link, Hash, Layers, ExternalLink, Menu
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { apiFetch, cn, formatDate, formatCurrency, getInitials } from "../lib/utils";
import LandingTab from "./LandingTab";

type TabId = "overview" | "institutions" | "users" | "licenses" | "monitoring" | "modules" | "landing" | "support";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Beranda", icon: LayoutDashboard },
  { id: "institutions", label: "Institusi", icon: Building2 },
  { id: "users", label: "Pengguna", icon: Users },
  { id: "licenses", label: "Lisensi", icon: CreditCard },
  { id: "monitoring", label: "Monitoring", icon: Activity },
  { id: "modules", label: "Modul", icon: Puzzle },
  { id: "landing", label: "Landing", icon: Globe },
  { id: "support", label: "Bantuan", icon: LifeBuoy },
];

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <aside className={`fixed md:relative z-40 inset-y-0 left-0 w-56 bg-slate-900 flex flex-col shrink-0 transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="p-4 border-b border-slate-700 bg-slate-800 flex items-center justify-between">
          <h1 className="text-white font-bold text-sm tracking-tight uppercase flex items-center gap-2">
            <ShieldCheck size={16} className="text-blue-400" /> VENDOR <span className="text-blue-400">HUB</span>
          </h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-slate-400 hover:text-white"><X size={16} /></button>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto custom-scrollbar">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }} className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all text-left",
                activeTab === tab.id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}>
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-800 text-[8px] text-slate-600 font-mono text-center">v3.0.0</div>
      </aside>
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/30 z-30 md:hidden" />}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4 md:hidden">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><Menu size={18} /></button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
              {activeTab === "overview" && <OverviewTab />}
              {activeTab === "institutions" && <InstitutionsTab />}
              {activeTab === "users" && <UsersTab />}
              {activeTab === "licenses" && <LicensesTab />}
              {activeTab === "monitoring" && <MonitoringTab />}
              {activeTab === "modules" && <ModulesTab />}
              {activeTab === "landing" && <LandingTab />}
              {activeTab === "support" && <SupportTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

/* ==================== OVERVIEW ==================== */
function OverviewTab() {
  const [stats, setStats] = useState({ totalInstitutions: 0, totalUsers: 0, activeLicenses: 0, onlineRs: 0 });
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try { setStats(await apiFetch("/api/vendor/dashboard")); } catch {}
    try { setInstitutions(await apiFetch("/api/vendor/institutions")); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 15000); return () => clearInterval(iv); }, [fetchData]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div>;

  const cards = [
    { label: "Institusi Terdaftar", value: stats.totalInstitutions, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Pengguna", value: stats.totalUsers, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Lisensi Aktif", value: stats.activeLicenses, icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "RS Online", value: stats.onlineRs, icon: Server, color: "text-cyan-600", bg: "bg-cyan-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Beranda Vendor</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Ringkasan Ekosistem SIMRS</p>
        </div>
        <button onClick={fetchData} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all"><RefreshCw size={14} /></button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", c.bg)}><c.icon size={18} className={c.color} /></div>
            <div className="text-[18px] font-black text-slate-900 tracking-tight">{c.value}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4">Daftar Institusi</h3>
          <div className="space-y-2">
            {institutions.slice(0, 8).map((inst: any) => (
              <div key={inst.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-white text-[8px] font-bold">{getInitials(inst.name)}</div>
                  <div><div className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">{inst.name}</div><div className="text-[8px] text-slate-400">{inst.city || "-"}</div></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest", inst.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>{inst.status}</span>
                  <div className={cn("w-2 h-2 rounded-full", inst.online ? "bg-emerald-500 animate-pulse" : "bg-red-300")} />
                </div>
              </div>
            ))}
            {institutions.length === 0 && <div className="py-12 text-center text-slate-300"><Activity size={32} className="mx-auto mb-2 opacity-50" /><p className="text-[10px] font-bold uppercase tracking-widest">Belum ada institusi</p></div>}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4">Distribusi Institusi</h3>
          <div className="space-y-3">
            {["hospital", "puskesmas", "clinic", "apotek", "practice"].map(type => (
              <div key={type} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{type}</span>
                <span className="text-xs font-black text-slate-900">{institutions.filter((i: any) => i.type === type).length}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600"><ShieldCheck size={16} /><span className="text-[10px] font-black uppercase tracking-widest">SIMRS Cloud Status</span></div>
            <div className="flex items-center gap-2 mt-2 text-emerald-600"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[9px] font-bold uppercase tracking-wider">All Systems Operational</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== INSTITUTIONS ==================== */
function InstitutionsTab() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editInst, setEditInst] = useState<any>(null);
  const [detailInst, setDetailInst] = useState<any>(null);
  const [form, setForm] = useState({ name: "", type: "hospital", address: "", phone: "", email: "", contactPerson: "", city: "", province: "" });
  const [loading, setLoading] = useState(true);
  const [createResult, setCreateResult] = useState<any>(null);

  const fetchList = useCallback(async () => {
    try { setInstitutions(await apiFetch("/api/vendor/institutions")); } catch {}
    setLoading(false);
  }, []);
  useEffect(() => { fetchList(); }, [fetchList]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div>;

  const filtered = institutions.filter((i: any) => i.name?.toLowerCase().includes(search.toLowerCase()) || i.city?.toLowerCase().includes(search.toLowerCase()));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editInst) {
      await apiFetch(`/api/vendor/institutions/${editInst.id}`, { method: "PATCH", body: JSON.stringify(form) });
      setShowModal(false); setEditInst(null); fetchList();
    } else {
      const result = await apiFetch("/api/vendor/institutions", { method: "POST", body: JSON.stringify(form) });
      setShowModal(false); setEditInst(null);
      setCreateResult(result);
    }
  };

  const toggleStatus = async (inst: any) => {
    await apiFetch(`/api/vendor/institutions/${inst.id}`, { method: "PATCH", body: JSON.stringify({ status: inst.status === "active" ? "suspended" : "active" }) });
    fetchList();
  };

  if (detailInst) return <InstitutionDetail inst={detailInst} onBack={() => setDetailInst(null)} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Manajemen Institusi</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{institutions.length} RS/Klinik terdaftar</p></div>
        <button onClick={() => { setEditInst(null); setForm({ name: "", type: "hospital", address: "", phone: "", email: "", contactPerson: "", city: "", province: "" }); setShowModal(true); }}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-[10px] flex items-center gap-2 hover:bg-black transition-all uppercase tracking-widest"><Plus size={14} /> Registrasi Baru</button>
      </div>
      <div className="relative max-w-xs"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari institusi..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr><th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Institusi</th><th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tipe</th><th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Kota</th><th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</th><th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Online</th><th className="px-4 py-3 text-right text-[9px] font-bold text-slate-400 uppercase tracking-widest">Aksi</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((inst: any) => (
              <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white text-[9px] font-bold">{getInitials(inst.name)}</div><div><button onClick={() => setDetailInst(inst)} className="font-bold text-xs text-slate-900 uppercase tracking-tight hover:text-blue-600 transition-colors">{inst.name}</button><div className="text-[8px] text-slate-400 font-mono">ID: {(inst.id || "").slice(0, 8).toUpperCase()}</div></div></div></td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[8px] font-bold uppercase tracking-wider">{inst.type}</span></td>
                <td className="px-4 py-3 text-[10px] text-slate-500">{inst.city || "-"}</td>
                <td className="px-4 py-3"><span className={cn("px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest", inst.status === "active" ? "bg-emerald-50 text-emerald-600" : inst.status === "trial" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600")}>{inst.status}</span></td>
                <td className="px-4 py-3"><div className={cn("w-2 h-2 rounded-full mx-auto", inst.online ? "bg-emerald-500 animate-pulse" : "bg-red-300")} /></td>
                <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1"><button onClick={() => { setForm({ name: inst.name, type: inst.type, address: inst.address, phone: inst.phone || "", email: inst.email || "", contactPerson: inst.contactPerson || "", city: inst.city || "", province: inst.province || "" }); setEditInst(inst); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-all"><Edit3 size={12} /></button><button onClick={() => toggleStatus(inst)} className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-amber-50 transition-all">{inst.status === "suspended" ? <Unlock size={12} /> : <Lock size={12} />}</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AnimatePresence>{showModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-900 p-5 flex items-center justify-between"><h3 className="text-white font-black uppercase tracking-tight text-sm">{editInst ? "Edit Institusi" : "Registrasi Baru"}</h3><button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white"><X size={16} /></button></div>
            <form onSubmit={handleSave} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3"><div className="col-span-2"><Label>Nama Institusi</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div><div><Label>Tipe</Label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none"><option value="hospital">🏥 Rumah Sakit</option><option value="puskesmas">🏘️ Puskesmas</option><option value="clinic">🩺 Klinik</option><option value="apotek">💊 Apotek</option><option value="practice">📋 Praktik Dokter</option></select></div><div><Label>Kota</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div></div>
              <div><Label>Alamat</Label><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none min-h-[60px]" /></div>
              <div className="grid grid-cols-2 gap-3"><div><Label>Telepon</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div><div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" /></div></div>
              <div><Label>Kontak Person</Label><Input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} /></div>
              <div className="flex gap-3 pt-3 border-t border-slate-100"><button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Batal</button><button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700">{editInst ? "Simpan" : "Daftarkan"}</button></div>
            </form>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* Success modal showing admin credentials */}
      <AnimatePresence>{createResult && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4" onClick={() => setCreateResult(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-emerald-600 p-5 text-white"><h3 className="font-black uppercase text-sm tracking-tight flex items-center gap-2"><CheckCircle size={16} /> Registrasi Berhasil</h3></div>
            <div className="p-5 space-y-4">
              <p className="text-[10px] text-slate-500">Berikut adalah kredensial untuk login ke dashboard admin RS:</p>
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
                <div><label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Email Admin</label><div className="text-sm font-bold text-slate-900 mt-0.5">{createResult.adminEmail}</div></div>
                <div><label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Password</label><div className="text-sm font-mono font-bold text-slate-900 mt-0.5">{createResult.adminPassword}</div></div>
                <div><label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">URL RS Publik</label><div className="text-sm text-blue-600 mt-0.5">/rs/{createResult.slug}</div></div>
                <div><label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Tunnel Token</label><div className="text-sm font-mono text-slate-900 mt-0.5">{createResult.tunnelToken}</div></div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2 text-[9px] text-amber-700"><AlertTriangle size={12} className="shrink-0 mt-0.5" /> Simpan data ini. Password tidak akan ditampilkan lagi.</div>
              <button onClick={() => setCreateResult(null)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-black">Tutup</button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}

const INST_TYPE_LABELS: Record<string, string> = {
  hospital: "🏥 Rumah Sakit", puskesmas: "🏘️ Puskesmas", clinic: "🩺 Klinik",
  apotek: "💊 Apotek", practice: "📋 Praktik Dokter",
};

function InstitutionDetail({ inst, onBack }: { inst: any; onBack: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [modData, setModData] = useState<{enabled: string[]; available: {key:string;label:string}[]; type: string} | null>(null);
  const [localModules, setLocalModules] = useState<string[]>([]);
  const [slug, setSlug] = useState("");
  const [editingSlug, setEditingSlug] = useState(false);
  const [domain, setDomain] = useState("");
  const [editingDomain, setEditingDomain] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailTab, setDetailTab] = useState<"info" | "modules" | "users" | "setup">("info");
  const [rsConfig, setRsConfig] = useState<any>(null);
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(true);

  const fetchDetail = useCallback(async () => {
    await Promise.all([
      apiFetch(`/api/vendor/users?institutionId=${inst.id}`).then(setUsers).catch(() => {}),
      apiFetch(`/api/vendor/institutions/${inst.id}/modules`).then(m => { setModData(m); setLocalModules(m.enabled || []); }).catch(() => {}),
      apiFetch(`/api/vendor/institutions/${inst.id}`).then(d => { setSlug(d.url_slug || ""); setDomain(d.domain || ""); }).catch(() => {}),
      apiFetch(`/api/vendor/institutions/${inst.id}/config`).then(setRsConfig).catch(() => {}),
    ]);
    setLoadingDetail(false);
  }, [inst.id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  if (loadingDetail) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div>;

  const toggleModule = (key: string) => {
    setLocalModules(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const saveModules = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/vendor/institutions/${inst.id}/modules`, {
        method: "PATCH", body: JSON.stringify({ modules: localModules })
      });
      window.location.reload();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  const applyTemplate = () => {
    if (modData) {
      setLocalModules(modData.available.map(m => m.key));
    }
  };

  const saveSlug = async () => {
    if (!/^[a-z0-9-]+$/.test(slug)) return alert("Slug hanya boleh huruf kecil, angka, dan tanda hubung.");
    setSaving(true);
    try {
      await apiFetch(`/api/vendor/institutions/${inst.id}/slug`, {
        method: "PATCH", body: JSON.stringify({ url_slug: slug })
      });
      setEditingSlug(false);
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  const saveDomain = async () => {
    if (!domain || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(domain))
      return alert("Format domain tidak valid. Contoh: rs-aone.simrshub.com");
    setSaving(true);
    try {
      await apiFetch(`/api/vendor/institutions/${inst.id}/domain`, {
        method: "PATCH", body: JSON.stringify({ domain })
      });
      setEditingDomain(false);
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  const typeLabel = INST_TYPE_LABELS[inst.type] || inst.type;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"><ChevronRight size={14} className="rotate-180" /> Kembali</button>

      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-white font-bold text-lg">{getInitials(inst.name)}</div>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{inst.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[8px] font-bold uppercase tracking-wider">{typeLabel}</span>
                <span className={cn("px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest", inst.status === "active" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600")}>{inst.status}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("w-2.5 h-2.5 rounded-full", inst.online ? "bg-emerald-500 animate-pulse" : "bg-red-300")} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{inst.online ? "Online" : "Offline"}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {[
          { id: "info" as const, label: "Info", icon: Building2 },
          { id: "modules" as const, label: "Modul", icon: Layers },
          { id: "users" as const, label: "Pengguna", icon: Users },
          { id: "setup" as const, label: "Setup RS", icon: Server },
        ].map(tab => (
          <button key={tab.id} onClick={() => setDetailTab(tab.id)} className={cn(
            "px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5",
            detailTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
          )}><tab.icon size={12} /> {tab.label}</button>
        ))}
      </div>

      {/* Tab: Info */}
      {detailTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Detail Institusi</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Alamat", value: inst.address },
                { label: "Kota", value: inst.city },
                { label: "Provinsi", value: inst.province },
                { label: "Telepon", value: inst.phone },
                { label: "Email", value: inst.email },
                { label: "ID Institusi", value: inst.id },
              ].map(d => (
                <div key={d.label}>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{d.label}</div>
                  <div className="text-[10px] font-medium text-slate-700 mt-0.5">{d.value || "-"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* URL Slug */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">URL Slug</h3>
            <p className="text-[8px] text-slate-400">Slug unik untuk identifikasi institusi di sistem vendor.</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-mono text-slate-600 flex items-center gap-1">
                <Hash size={10} className="text-slate-400" />
                <span className="font-bold text-slate-900">{editingSlug ? slug : (slug || "-")}</span>
              </div>
              {editingSlug ? (
                <div className="flex gap-1">
                  <button onClick={saveSlug} disabled={saving} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-blue-700">{saving ? "..." : "Simpan"}</button>
                  <button onClick={() => setEditingSlug(false)} className="px-3 py-2 text-[8px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600">Batal</button>
                </div>
              ) : (
                <button onClick={() => setEditingSlug(true)} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-slate-200"><Edit3 size={10} /></button>
              )}
            </div>
            {editingSlug && (
              <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="nama-institusi"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none" autoFocus />
            )}
          </div>

          {/* Public URL */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Website Publik</h3>
            <p className="text-[8px] text-slate-400">Bagikan link ini ke pasien agar bisa akses profil RS, jadwal dokter, hasil lab, dan antrian online.</p>
            {slug ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-[10px] font-mono text-blue-700 flex items-center gap-1">
                  <Globe size={10} />
                  <span className="font-bold">{window.location.origin}/rs/{slug}</span>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/rs/${slug}`); setCopied("url"); setTimeout(() => setCopied(""), 2000); }}
                  className={cn("px-3 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all", copied === "url" ? "bg-emerald-500 text-white" : "bg-blue-100 text-blue-600 hover:bg-blue-200")}>
                  {copied === "url" ? "✓" : <Copy size={10} />}
                </button>
                <a href={`/rs/${slug}`} target="_blank" className="px-3 py-2 bg-slate-900 text-white rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-black transition-all"><ExternalLink size={10} /></a>
              </div>
            ) : (
              <p className="text-[8px] text-amber-600">Atur slug terlebih dahulu agar link publik bisa diakses.</p>
            )}
          </div>

          {/* Domain */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Domain Kustom</h3>
            <p className="text-[8px] text-slate-400">Domain khusus untuk akses publik ke server RS. Contoh: <code className="bg-slate-100 px-1 rounded">rs-aone.simrshub.com</code></p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-mono text-slate-600 flex items-center gap-1">
                <Link size={10} className="text-slate-400" />
                <span className="font-bold text-slate-900">{editingDomain ? domain : (domain || "—")}</span>
              </div>
              {editingDomain ? (
                <div className="flex gap-1">
                  <button onClick={saveDomain} disabled={saving} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-blue-700">{saving ? "..." : "Simpan"}</button>
                  <button onClick={() => setEditingDomain(false)} className="px-3 py-2 text-[8px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600">Batal</button>
                </div>
              ) : (
                <button onClick={() => setEditingDomain(true)} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-slate-200"><Edit3 size={10} /></button>
              )}
            </div>
            {editingDomain && (
              <input value={domain} onChange={e => setDomain(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ""))}
                placeholder="rs-aone.simrshub.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none" autoFocus />
            )}
          </div>
        </div>
      )}

      {/* Tab: Modules */}
      {detailTab === "modules" && (
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Layers size={12} /> Konfigurasi Modul</h3>
              <p className="text-[8px] text-slate-400 mt-0.5">Aktifkan/nonaktifkan modul untuk institusi ini ({localModules.length} aktif)</p>
            </div>
            <div className="flex gap-2">
              <button onClick={applyTemplate} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-blue-100"><RefreshCw size={10} /> Reset ke Default</button>
              <button onClick={saveModules} disabled={saving} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-black">{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {(modData?.available || []).map(m => {
              const enabled = localModules.includes(m.key);
              return (
                <button key={m.key} onClick={() => toggleModule(m.key)}
                  className={cn(
                    "p-3 rounded-lg border text-left flex items-center justify-between transition-all",
                    enabled ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200 opacity-60"
                  )}>
                  <span className={cn("text-[9px] font-bold uppercase tracking-tight", enabled ? "text-emerald-700" : "text-slate-500")}>{m.label}</span>
                  {enabled ? <ToggleRight size={14} className="text-emerald-500" /> : <ToggleLeft size={14} className="text-slate-300" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Users */}
      {detailTab === "users" && (
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2"><Users size={12} /> Pengguna ({users.length})</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
            {users.map((u: any) => (
              <div key={u.user_id} className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[8px] font-bold">{u.display_name?.charAt(0)}</div>
                  <div><div className="text-[9px] font-bold text-slate-800 uppercase">{u.display_name}</div><div className="text-[8px] text-slate-400">{u.role}</div></div>
                </div>
                <span className={cn("px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest", u.status === "suspended" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>{u.status || "active"}</span>
              </div>
            ))}
            {users.length === 0 && <p className="text-[9px] text-slate-400 text-center py-4">Belum ada pengguna</p>}
          </div>
        </div>
      )}

      {/* Tab: Setup RS */}
      {detailTab === "setup" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Server size={12} /> Konfigurasi RS Fisik</h3>
            <p className="text-[8px] text-slate-400 mb-4">Gunakan data ini untuk menghubungkan server RS fisik ke VPS Hub. Salin dan masukkan di Panel Admin RS → Setup VPS.</p>
            {rsConfig ? (
              <div className="space-y-3">
                <ConfigField label="RS ID" value={rsConfig.rsId} />
                <ConfigField label="Tunnel Token" value={rsConfig.tunnelToken} masked />
                <ConfigField label="VPS URL" value={rsConfig.vpsUrl} />
                <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg text-[8px] text-amber-700"><AlertTriangle size={10} /> Token hanya ditampilkan sekali. Simpan baik-baik.</div>
              </div>
            ) : (
              <div className="py-8 text-center text-[9px] text-slate-400">Memuat konfigurasi...</div>
            )}
          </div>

          {/* Generate License Key */}
          <LicenseGeneratorPanel instId={inst.id} instName={inst.name} instModules={inst.modules || []} />

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3">Panduan Setup</h3>
            <ol className="list-decimal list-inside space-y-2 text-[10px] text-slate-600">
              <li>Install server RS fisik di komputer rumah sakit</li>
              <li>Buka <strong>http://localhost:3000</strong> dan login sebagai <strong>admin_rs</strong></li>
              <li>Buka <strong>Panel Admin RS → Setup & Aktivasi Lisensi</strong></li>
              <li>Generate License Key di panel ini, lalu salin License Key, RS ID, dan Tunnel Token</li>
              <li>Tempel semua data tersebut di form Aktivasi Lisensi di Admin RS</li>
              <li>Sistem akan terverifikasi ke Vendor Hub dan nama RS akan berubah secara otomatis</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

function LicenseGeneratorPanel({ instId, instName, instModules }: { instId: string; instName: string; instModules: any[] }) {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<any>(null);
  const [form, setForm] = useState({ plan: "professional", validDays: "365" });
  const [copied, setCopied] = useState("");

  const fetchLicenses = useCallback(async () => {
    try { setLicenses(await apiFetch(`/api/vendor/institutions/${instId}/licenses`)); } catch {}
  }, [instId]);

  useEffect(() => { fetchLicenses(); }, [fetchLicenses]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await apiFetch("/api/vendor/license/generate", {
        method: "POST",
        body: JSON.stringify({ institutionId: instId, plan: form.plan, validDays: parseInt(form.validDays) })
      });
      setGenerated(res);
      fetchLicenses();
    } catch (err: any) { alert(err.message); } finally { setGenerating(false); }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={12} className="text-emerald-600" /> Generate Kode Lisensi</h3>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{instName}</span>
      </div>

      {generated && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
          <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">✅ Kode Lisensi Berhasil Dibuat</p>
          {[
            { label: "License Key", value: generated.licenseKey, key: "lic" },
            { label: "RS ID", value: instId, key: "rsid" },
          ].map(f => (
            <div key={f.key} className="flex items-center gap-2">
              <div className="flex-1">
                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{f.label}</div>
                <div className="font-mono text-[10px] text-slate-900 font-bold bg-white rounded px-2 py-1 mt-0.5">{f.value}</div>
              </div>
              <button onClick={() => copyText(f.value, f.key)} className={cn("px-3 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all", copied === f.key ? "bg-emerald-500 text-white" : "bg-white text-slate-500 hover:bg-slate-100")}>
                {copied === f.key ? "✓ Copied" : <Copy size={10} />}
              </button>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-2 text-[8px]">
            <div className="bg-white rounded p-2"><div className="text-slate-400 font-bold uppercase tracking-widest">Plan</div><div className="font-bold text-slate-700 mt-0.5">{generated.plan?.toUpperCase()}</div></div>
            <div className="bg-white rounded p-2"><div className="text-slate-400 font-bold uppercase tracking-widest">Valid Hingga</div><div className="font-bold text-slate-700 mt-0.5">{generated.validUntil ? new Date(generated.validUntil).toLocaleDateString("id-ID") : "∞"}</div></div>
            <div className="bg-white rounded p-2"><div className="text-slate-400 font-bold uppercase tracking-widest">Modul</div><div className="font-bold text-slate-700 mt-0.5">{Array.isArray(generated.modules) ? generated.modules.length : "—"} aktif</div></div>
          </div>
          <button onClick={() => setGenerated(null)} className="w-full py-2 text-[9px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Tutup</button>
        </div>
      )}

      <form onSubmit={handleGenerate} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Plan</div>
            <select value={form.plan} onChange={e => setForm({...form, plan: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none">
              <option value="trial">Trial (Demo)</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Masa Berlaku (hari)</div>
            <input type="number" value={form.validDays} onChange={e => setForm({...form, validDays: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none" min="1" placeholder="365" />
          </div>
        </div>
        <button type="submit" disabled={generating} className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-[9px] uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
          {generating ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><ShieldCheck size={12} /> Generate License Key</>}
        </button>
      </form>

      {licenses.length > 0 && (
        <div>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2">Riwayat Lisensi</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {licenses.map((l: any) => (
              <div key={l.license_key} className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="text-[8px] font-mono text-slate-700 font-bold">{l.license_key?.slice(0, 24)}...</div>
                  <div className="text-[7px] text-slate-400">{l.plan?.toUpperCase()} · Berlaku: {l.end_date ? new Date(l.end_date).toLocaleDateString("id-ID") : "Selamanya"}</div>
                </div>
                <span className={cn("px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest", l.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>{l.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== USERS ==================== */
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterInst, setFilterInst] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", displayName: "", role: "front_office" });
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try { setUsers(await apiFetch("/api/vendor/users")); } catch {}
    try { setInstitutions(await apiFetch("/api/vendor/institutions")); } catch {}
    setLoading(false);
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div>;

  const filtered = users.filter((u: any) => {
    const ms = u.display_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const mi = !filterInst || u.institution_id === filterInst;
    const mr = !filterRole || u.role === filterRole;
    return ms && mi && mr;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newUser.email || !newUser.password || !newUser.displayName) return;
    setCreating(true);
    try { await apiFetch("/api/vendor/auth/register", { method: "POST", body: JSON.stringify({ ...newUser, institutionId: filterInst || undefined }) }); setShowCreate(false); fetchData(); } catch (err: any) { alert(err.message); } finally { setCreating(false); }
  };

  const handleSuspend = async (u: any) => {
    const next = u.status === "suspended" ? "active" : "suspended";
    await apiFetch(`/api/vendor/users/${u.user_id}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
    fetchData();
  };

  const instName = (id?: string) => institutions.find((i: any) => i.id === id)?.name || "-";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Manajemen Pengguna</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{users.length} total pengguna</p></div>
        <button onClick={() => setShowCreate(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-[10px] flex items-center gap-2 hover:bg-black transition-all uppercase tracking-widest"><UserPlus size={14} /> Tambah User</button>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama/email..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
        <select value={filterInst} onChange={e => setFilterInst(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold outline-none"><option value="">Semua Institusi</option>{institutions.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold outline-none"><option value="">Semua Role</option>{["super_admin","admin_rs","dokter","perawat","front_office","kasir","apoteker","analis","radiografer","residen","coder","karu","manajemen"].map(r => <option key={r} value={r}>{r}</option>)}</select>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pengguna</th><th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Email</th><th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Role</th><th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Institusi</th><th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</th><th className="px-4 py-3 text-right text-[9px] font-bold text-slate-400 uppercase tracking-widest">Aksi</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((u: any) => (
              <tr key={u.user_id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[9px] font-bold">{u.display_name?.charAt(0)}</div><span className="font-bold text-[10px] text-slate-900 uppercase tracking-tight">{u.display_name}</span></div></td>
                <td className="px-4 py-3 text-[9px] text-slate-500 font-mono">{u.email}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-bold uppercase tracking-widest">{u.role}</span></td>
                <td className="px-4 py-3 text-[9px] text-slate-500 font-bold uppercase tracking-tight">{instName(u.institution_id)}</td>
                <td className="px-4 py-3"><span className={cn("px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest", u.status === "suspended" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>{u.status || "active"}</span></td>
                <td className="px-4 py-3 text-right"><button onClick={() => setEditingUser(u)} className="px-2 py-1 bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white rounded transition-all text-[8px] font-bold uppercase tracking-widest">Kelola</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AnimatePresence>{editingUser && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4" onClick={() => setEditingUser(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-blue-600 p-5 text-white"><h3 className="font-black uppercase text-sm tracking-tight">Kelola Pengguna</h3></div>
            <form onSubmit={async (e) => { e.preventDefault(); if (editingUser) { await apiFetch(`/api/vendor/users/${editingUser.user_id}`, { method: "PATCH", body: JSON.stringify({ role: editingUser.role }) }); setEditingUser(null); fetchData(); }}} className="p-5 space-y-3">
              <div className="text-center pb-2"><div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-blue-600 font-bold mx-auto mb-1">{editingUser.display_name?.charAt(0)}</div><div className="font-bold text-sm uppercase">{editingUser.display_name}</div><div className="text-[9px] text-slate-400 font-mono">{editingUser.email}</div></div>
              <div><Label>Role</Label><select value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none">{["super_admin","admin_rs","dokter","perawat","front_office","kasir","apoteker","analis","radiografer","residen","coder","karu","manajemen"].map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}</select></div>
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={async () => { if (!editingUser) return; const suspended = editingUser.status !== "suspended"; await apiFetch(`/api/vendor/users/${editingUser.user_id}`, { method: "PATCH", body: JSON.stringify({ status: suspended ? "suspended" : "active" }) }); setEditingUser({ ...editingUser, status: suspended ? "suspended" : "active" }); }} className={cn("flex-1 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all", editingUser.status === "suspended" ? "bg-green-500 text-white hover:bg-green-600" : "bg-red-50 text-red-600 hover:bg-red-100")}>{editingUser.status === "suspended" ? "Aktifkan" : "Nonaktifkan"}</button>
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tutup</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700">Simpan</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
      <AnimatePresence>{showCreate && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-blue-600 p-5 text-white"><h3 className="font-black uppercase text-sm tracking-tight">Tambah User Baru</h3></div>
            <form onSubmit={handleCreate} className="p-5 space-y-3">
              <div><Label>Nama Lengkap</Label><input value={newUser.displayName} onChange={e => setNewUser({ ...newUser, displayName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none" required /></div>
              <div><Label>Email</Label><input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none" required /></div>
              <div><Label>Password</Label><input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none" required minLength={6} /></div>
              <div><Label>Role</Label><select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none">{["super_admin","admin_rs","dokter","perawat","front_office","kasir","apoteker","analis","radiografer","residen","coder","karu","manajemen"].map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}</select></div>
              <div className="flex gap-3 pt-3 border-t border-slate-100"><button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Batal</button><button type="submit" disabled={creating} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50">{creating ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" /> : "Buat User"}</button></div>
            </form>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}

/* ==================== LICENSES ==================== */
function LicensesTab() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ institutionId: "", plan: "starter", status: "trial", maxUsers: 15, autoRenew: true });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try { setLicenses(await apiFetch("/api/vendor/licenses")); } catch {}
    try { setInstitutions(await apiFetch("/api/vendor/institutions")); } catch {}
    setLoading(false);
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div>;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch("/api/vendor/licenses", { method: "POST", body: JSON.stringify({ ...form, startDate: new Date().toISOString() }) });
    setShowModal(false); fetchData();
  };

  const PLANS = [
    { key: "free", label: "Gratis", price: 0, maxUsers: 5 },
    { key: "starter", label: "Starter", price: 500000, maxUsers: 15 },
    { key: "professional", label: "Professional", price: 1500000, maxUsers: 50 },
    { key: "enterprise", label: "Enterprise", price: 4000000, maxUsers: 999 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Manajemen Lisensi</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{licenses.length} lisensi</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-[10px] flex items-center gap-2 hover:bg-black transition-all uppercase tracking-widest"><Plus size={14} /> Buat Lisensi</button>
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[9px] text-amber-700 flex items-center gap-2">
        <AlertTriangle size={14} />
        <span>Untuk <strong>generate License Key</strong>, buka <strong>Institusi → klik nama RS → Setup RS</strong>. Lisensi di halaman ini hanya untuk manajemen data.</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {PLANS.map(p => (
          <div key={p.key} className={cn("bg-white p-5 rounded-xl border-2 shadow-sm", p.key === "starter" ? "border-blue-200" : "border-slate-200")}>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.label}</div>
            <div className="text-xl font-black text-slate-900 mt-1">{formatCurrency(p.price)}<span className="text-[9px] text-slate-400 font-bold">/bln</span></div>
            <div className="text-[9px] text-slate-500 mt-1">Maks {p.maxUsers} user</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Institusi</th><th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Plan</th><th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</th><th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Maks User</th><th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mulai</th><th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Berakhir</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {licenses.map((l: any) => (
              <tr key={l.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 text-[10px] font-bold text-slate-900">{institutions.find((i: any) => i.id === l.institution_id)?.name || l.institution_id || "-"}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[8px] font-bold uppercase">{l.plan}</span></td>
                <td className="px-4 py-3"><span className={cn("px-2 py-0.5 rounded text-[8px] font-bold", l.status === "active" ? "bg-emerald-100 text-emerald-600" : l.status === "trial" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600")}>{l.status}</span></td>
                <td className="px-4 py-3 text-[10px] font-bold text-slate-700">{l.max_users}</td>
                <td className="px-4 py-3 text-[9px] text-slate-500 font-mono">{l.start_date ? formatDate(l.start_date) : "-"}</td>
                <td className="px-4 py-3 text-[9px] text-slate-500 font-mono">{l.end_date ? formatDate(l.end_date) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AnimatePresence>{showModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-emerald-600 p-5 text-white"><h3 className="font-black uppercase text-sm tracking-tight">Buat Lisensi Baru</h3></div>
            <form onSubmit={handleCreate} className="p-5 space-y-3">
              <div><Label>Institusi</Label><select value={form.institutionId} onChange={e => setForm({ ...form, institutionId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none" required><option value="">-- Pilih --</option>{institutions.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3"><div><Label>Plan</Label><select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none"><option value="free">Gratis</option><option value="starter">Starter</option><option value="professional">Professional</option><option value="enterprise">Enterprise</option></select></div><div><Label>Status</Label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none"><option value="trial">Trial</option><option value="active">Active</option><option value="expired">Expired</option></select></div></div>
              <div className="grid grid-cols-2 gap-3"><div><Label>Maks User</Label><input type="number" value={form.maxUsers} onChange={e => setForm({ ...form, maxUsers: parseInt(e.target.value) || 5 })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none" /></div><div><Label>&nbsp;</Label><label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={form.autoRenew} onChange={e => setForm({ ...form, autoRenew: e.target.checked })} className="rounded" /><span className="text-[10px] font-bold text-slate-500">Auto Renew</span></label></div></div>
              <div className="flex gap-3 pt-3 border-t border-slate-100"><button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Batal</button><button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-700">Buat Lisensi</button></div>
            </form>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}

/* ==================== MONITORING ==================== */
function MonitoringTab() {
  const [onlineRs, setOnlineRs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchOnline = useCallback(async () => { try { setOnlineRs(await apiFetch("/api/vendor/online-rs")); } catch {}; setLoading(false); }, []);
  useEffect(() => { fetchOnline(); const iv = setInterval(fetchOnline, 10000); return () => clearInterval(iv); }, [fetchOnline]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Monitoring RS</h2>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest -mt-3">Status koneksi tunnel real-time</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {onlineRs.length === 0 && <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">Belum ada RS yang online</div>}
        {onlineRs.map((rs: any) => (
          <div key={rs.rsId} className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="font-bold text-xs uppercase tracking-tight">{rs.rsId}</span></div>
              <span className="text-[8px] text-slate-400 font-mono">v{rs.version || "-"}</span>
            </div>
            <div className="text-[9px] text-slate-500 space-y-1">
              <div>Connected: {rs.connectedAt ? new Date(rs.connectedAt).toLocaleString("id-ID") : "-"}</div>
              <div>Heartbeat: {rs.lastHeartbeat ? new Date(rs.lastHeartbeat).toLocaleString("id-ID") : "-"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================== MODULES ==================== */
const INST_TYPE_LABELS_LIST: { key: string; label: string; icon: string; desc: string }[] = [
  { key: "hospital", label: "Rumah Sakit", icon: "🏥", desc: "Tipe A — 31 modul lengkap (rawat inap, OK, ICU, Casemix, dll)" },
  { key: "puskesmas", label: "Puskesmas", icon: "🏘️", desc: "16 modul esensial (fokus rawat jalan, laboratorium, rujukan)" },
  { key: "clinic", label: "Klinik", icon: "🩺", desc: "14 modul (rawat jalan, farmasi, billing)" },
  { key: "apotek", label: "Apotek", icon: "💊", desc: "9 modul (fokus farmasi, stok, billing)" },
  { key: "practice", label: "Praktik Dokter", icon: "📋", desc: "10 modul ringan (rekam medis, billing, BPJS)" },
];

const ALL_MODULES = [
  { key: "dashboard", label: "Dashboard" }, { key: "patients", label: "Pendaftaran Pasien" },
  { key: "queue", label: "Sistem Antrian" }, { key: "records", label: "Rekam Medis" },
  { key: "pharmacy", label: "Farmasi" }, { key: "laboratory", label: "Laboratorium" },
  { key: "billing", label: "Billing & Kasir" }, { key: "inpatient", label: "Rawat Inap" },
  { key: "reports", label: "Laporan & BI" }, { key: "triage", label: "IGD Triage" },
  { key: "pacs", label: "PACS/Radiologi" }, { key: "bpjs", label: "BPJS Bridging" },
  { key: "satusehat", label: "SatuSehat" }, { key: "casemix", label: "Casemix/Coder" },
  { key: "surgery", label: "OK / Operasi" }, { key: "icu", label: "ICU / NICU" },
  { key: "diet", label: "Gizi / Diet" }, { key: "cssd", label: "CSSD" },
  { key: "bloodbank", label: "Bank Darah" }, { key: "rehab", label: "Rehab Medik" },
  { key: "chemo", label: "Kemoterapi" }, { key: "hd", label: "Hemodialisis" },
  { key: "mcu", label: "Medical Check Up" }, { key: "employees", label: "Kepegawaian" },
  { key: "assets", label: "Manajemen Aset" }, { key: "kars", label: "KARS / Mutu" },
  { key: "incidents", label: "Incident Report" }, { key: "feedback", label: "Feedback Pasien" },
  { key: "discharge", label: "Discharge Summary" }, { key: "referral", label: "Surat Rujukan" },
  { key: "consent", label: "Informed Consent" },
];

function ModulesTab() {
  const [templates, setTemplates] = useState<Record<string, { key: string; label: string }[]>>({});
  const [selectedType, setSelectedType] = useState("hospital");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setTemplates(await apiFetch("/api/vendor/module-templates")); } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div>;

  const currentModules = templates[selectedType] || [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Modul SIMRS</h2>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest -mt-3">Konfigurasi modul berdasarkan tipe institusi</p>

      {/* Type selector cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {INST_TYPE_LABELS_LIST.map(t => (
          <button key={t.key} onClick={() => setSelectedType(t.key)} className={cn(
            "bg-white p-4 rounded-xl border-2 text-left transition-all",
            selectedType === t.key ? "border-blue-500 shadow-md" : "border-slate-200 hover:border-slate-300"
          )}>
            <div className="text-lg mb-1">{t.icon}</div>
            <div className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{t.label}</div>
            <div className="text-[7px] text-slate-400 mt-0.5">{currentModules.length} modul</div>
          </button>
        ))}
      </div>

      {/* Module grid */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
            {INST_TYPE_LABELS_LIST.find(t => t.key === selectedType)?.icon} {INST_TYPE_LABELS_LIST.find(t => t.key === selectedType)?.label}
          </h3>
          <span className="text-[8px] text-slate-400">{currentModules.length} modul</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {ALL_MODULES.map(m => {
            const included = currentModules.some(cm => cm.key === m.key);
            return (
              <div key={m.key} className={cn("p-3 rounded-lg border text-center transition-all", included ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200 opacity-40")}>
                {included ? <CheckCircle2 size={14} className="text-emerald-500 mx-auto mb-1" /> : <X size={14} className="text-slate-300 mx-auto mb-1" />}
                <div className={cn("text-[8px] font-bold uppercase tracking-tight", included ? "text-emerald-700" : "text-slate-400")}>{m.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-[9px] text-blue-700 leading-relaxed">
          {INST_TYPE_LABELS_LIST.find(t => t.key === selectedType)?.icon} <strong>{INST_TYPE_LABELS_LIST.find(t => t.key === selectedType)?.label}:</strong>{' '}
          {INST_TYPE_LABELS_LIST.find(t => t.key === selectedType)?.desc}
        </p>
      </div>
    </div>
  );
}

/* ==================== SUPPORT ==================== */
function SupportTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Pusat Bantuan</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 mb-4"><LifeBuoy size={20} className="text-blue-600" /><h3 className="font-black text-sm uppercase tracking-tight">Dokumentasi</h3></div>
          <p className="text-[10px] text-slate-500 mb-4">Panduan penggunaan Vendor Hub dan manajemen RS.</p>
          <a href="mailto:support@aone-trust.com" className="text-[10px] font-bold text-blue-600 hover:underline">support@aone-trust.com</a>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 mb-4"><MessageSquare size={20} className="text-emerald-600" /><h3 className="font-black text-sm uppercase tracking-tight">Kontak</h3></div>
          <div className="space-y-2 text-[10px] text-slate-500"><div><span className="font-bold">Email:</span> support@aone-trust.com</div><div><span className="font-bold">Telepon:</span> +62-xxx-xxxx</div><div><span className="font-bold">Jam Kerja:</span> 08:00 - 17:00 WIB</div></div>
        </div>
      </div>
    </div>
  );
}

/* ==================== HELPERS ==================== */
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{children}</label>;
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20" />;
}
function ConfigField({ label, value, masked }: { label: string; value: string; masked?: boolean }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const displayValue = masked && !show ? value.slice(0, 8) + "••••••••••" : value;
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-[10px] font-mono text-slate-900 bg-white px-2 py-1.5 rounded border border-slate-200 truncate">{displayValue}</code>
        {masked && <button onClick={() => setShow(!show)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-white transition-all"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={show ? "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" : "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"} /><circle cx="12" cy="12" r="3"/></svg></button>}
        <button onClick={handleCopy} className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-white transition-all"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
      </div>
      {copied && <div className="text-[7px] text-emerald-600 font-bold mt-1 uppercase tracking-widest">Tersalin!</div>}
    </div>
  );
}
