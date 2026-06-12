import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Globe, Save, LogOut, Plus, X, ChevronDown, ChevronRight,
  Image, Users, Building2, Activity, AlertCircle, CheckCircle, ArrowLeft, Menu,
  Upload, Trash2
} from "lucide-react";
import { apiFetch, cn } from "../lib/utils";

function useImageUpload() {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadOk, setUploadOk] = useState<Record<string, boolean>>({});
  const doUpload = async (field: string, cb: (url: string) => void) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(p => ({ ...p, [field]: true }));
      setUploadOk(p => ({ ...p, [field]: false }));
      const fd = new FormData();
      fd.append("file", file);
      try {
        const r = await fetch("/api/vendor/upload", { method: "POST", headers: { Authorization: "Bearer " + localStorage.getItem("vps_token") }, body: fd });
        const d = await r.json();
        if (d.url) { cb(d.url); setUploadOk(p => ({ ...p, [field]: true })); setTimeout(() => setUploadOk(p => ({ ...p, [field]: false })), 2000); }
      } catch { alert("Upload gagal"); }
      setUploading(p => ({ ...p, [field]: false }));
    };
    input.click();
  };
  return { uploading, uploadOk, doUpload };
}

function ImagePreview({ src, onRemove }: { src: string; onRemove?: () => void }) {
  if (!src) return null;
  return (
    <div className="relative group w-20 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0">
      <img src={src} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
      {onRemove && <button onClick={onRemove} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><X size={14} /></button>}
    </div>
  );
}

export default function AdminRSDashboard() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [inst, setInst] = useState<any>(null);
  const [cfg, setCfg] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"profile" | "polyclinics" | "gallery" | "promotions" | "services" | "hours">("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const showToast = (type: "success" | "error", msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };
  const img = useImageUpload();

  useEffect(() => {
    const token = localStorage.getItem("vps_token");
    if (!token) { navigate("/login"); return; }
    apiFetch("/api/vendor/auth/me").then(d => {
      if (!d?.user) { localStorage.removeItem("vps_token"); navigate("/login"); return; }
      setUser(d.user);
      return apiFetch(`/api/vendor/my/institution?slug=${slug}`);
    }).then(d => {
      if (!d) return;
      if (d.error) { navigate("/login"); return; }
      setInst(d);
      setCfg(d.publicConfig || {});
    }).catch(() => { localStorage.removeItem("vps_token"); navigate("/login"); });
  }, [slug, navigate]);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/vendor/my/institution/config?slug=${slug}`, {
        method: "PATCH",
        body: JSON.stringify({ config: cfg }),
      });
      setSaved(true);
      showToast("success", "Perubahan berhasil disimpan!");
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) { showToast("error", err.message || "Gagal menyimpan"); }
    setSaving(false);
  };

  const setNested = (path: string, value: any) => {
    setCfg((prev: any) => {
      const copy = { ...prev };
      const keys = path.split(".");
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  const addArrayItem = (path: string, template: any) => {
    setCfg((prev: any) => {
      const copy = { ...prev };
      const keys = path.split(".");
      let obj = copy;
      for (const k of keys) {
        if (!obj[k]) obj[k] = [];
        obj = obj[k];
      }
      obj.push(template);
      return copy;
    });
  };

  const removeArrayItem = (path: string, index: number) => {
    setCfg((prev: any) => {
      const copy = { ...prev };
      const keys = path.split(".");
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]].splice(index, 1);
      return copy;
    });
  };

  const updateArrayItem = (path: string, index: number, field: string, value: string) => {
    setCfg((prev: any) => {
      const copy = { ...prev };
      const keys = path.split(".");
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      if (obj[keys[keys.length - 1]]?.[index]) {
        obj[keys[keys.length - 1]][index][field] = value;
      }
      return copy;
    });
  };

  const logout = () => { localStorage.removeItem("vps_token"); navigate("/login"); };

  if (!user || !inst) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div>;

  const TABS = [
    { id: "profile" as const, label: "Profil", icon: Building2 },
    { id: "polyclinics" as const, label: "Poli & Spesialis", icon: Users },
    { id: "gallery" as const, label: "Galeri", icon: Image },
    { id: "promotions" as const, label: "Promo", icon: Activity },
    { id: "services" as const, label: "Layanan", icon: Activity },
    { id: "hours" as const, label: "Jam Operasional", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {toast.msg}
        </div>
      )}
      <div className={`fixed md:relative z-40 inset-y-0 left-0 w-56 bg-slate-900 text-white flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"><Globe size={14} /></div>
            <div>
              <div className="font-black text-[10px] uppercase tracking-tight">Website RS</div>
              <div className="text-[8px] text-slate-500 truncate w-40">{inst?.name}</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-slate-400 hover:text-white"><X size={16} /></button>
        </div>
        <Link to={`/rs/${slug}`} className="flex items-center gap-1 text-[8px] text-blue-400 hover:text-blue-300 transition-colors px-4 pb-2"><ArrowLeft size={10} /> Lihat Website</Link>
        <nav className="flex-1 p-2 space-y-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSidebarOpen(false); }}
              className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                tab === t.id ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800")}>
              <t.icon size={12} /> {t.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="text-[9px] text-slate-500 mb-2 truncate">{user?.email}</div>
          <button onClick={logout} className="flex items-center gap-2 text-[9px] text-slate-400 hover:text-white uppercase tracking-widest font-bold"><LogOut size={10} /> Logout</button>
        </div>
      </div>
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/30 z-30 md:hidden" />}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-0 mb-6">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg"><Menu size={18} /></button>
            <div className="flex-1">
              <h1 className="font-black text-lg text-slate-900 uppercase tracking-tight">Kelola Website</h1>
              <p className="text-[10px] text-slate-400">{inst?.name}</p>
            </div>
            <button onClick={save} disabled={saving}
              className={cn("px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all shrink-0",
                saved ? "bg-emerald-500 text-white" : "bg-slate-900 text-white hover:bg-black")}>
              {saving ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : saved ? <CheckCircle size={12} /> : <Save size={12} />}
              {saved ? "Tersimpan" : "Simpan"}
            </button>
          </div>

          {tab === "profile" && <ProfileEditor cfg={cfg} setNested={setNested} img={img} />}
          {tab === "polyclinics" && <ArrayEditor title="Poli & Spesialis" items={cfg.polyclinics || []} fields={[
            { key: "name", label: "Nama Poli", placeholder: "Poli Umum" },
            { key: "description", label: "Deskripsi", placeholder: "Pelayanan kesehatan dasar" },
          ]} addTemplate={{ name: "", description: "", specialists: [] }} onAdd={(t) => addArrayItem("polyclinics", t)}
            onRemove={(i) => removeArrayItem("polyclinics", i)} onChange={(i, f, v) => updateArrayItem("polyclinics", i, f, v)}
            renderExtra={(item, i) => (
              <div className="mt-2">
                <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Spesialis (enter per baris)</label>
                <textarea value={(item.specialists || []).join("\n")} onChange={e => updateArrayItem("polyclinics", i, "specialists", e.target.value.split("\n").filter(Boolean))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[10px] outline-none mt-1" rows={2} />
              </div>
            )} />}

          {tab === "gallery" && <GalleryEditor items={cfg.gallery || []}
            onAdd={(t) => addArrayItem("gallery", t)} onRemove={(i) => removeArrayItem("gallery", i)}
            onChange={(i, f, v) => updateArrayItem("gallery", i, f, v)} img={img} />}

          {tab === "promotions" && <PromoEditor items={cfg.promotions || []}
            onAdd={(t) => addArrayItem("promotions", t)} onRemove={(i) => removeArrayItem("promotions", i)}
            onChange={(i, f, v) => updateArrayItem("promotions", i, f, v)} img={img} />}

          {tab === "services" && <ArrayEditor title="Layanan" items={cfg.services || []} fields={[
            { key: "name", label: "Nama Layanan", placeholder: "IGD 24 Jam" },
            { key: "description", label: "Deskripsi", placeholder: "Pelayanan gawat darurat" },
          ]} addTemplate={{ name: "", description: "" }}
            onAdd={(t) => addArrayItem("services", t)} onRemove={(i) => removeArrayItem("services", i)}
            onChange={(i, f, v) => updateArrayItem("services", i, f, v)} />}

          {tab === "hours" && <ArrayEditor title="Jam Operasional" items={cfg.operationalHours || []} fields={[
            { key: "day", label: "Hari", placeholder: "Senin - Jumat" },
            { key: "buka", label: "Jam Buka", placeholder: "08:00" },
            { key: "tutup", label: "Jam Tutup", placeholder: "20:00" },
          ]} addTemplate={{ day: "", buka: "", tutup: "" }}
            onAdd={(t) => addArrayItem("operationalHours", t)} onRemove={(i) => removeArrayItem("operationalHours", i)}
            onChange={(i, f, v) => updateArrayItem("operationalHours", i, f, v)} />}
        </div>
      </div>
    </div>
  );
}

function ProfileEditor({ cfg, setNested, img }: { cfg: any; setNested: (path: string, val: any) => void; img: any }) {
  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Informasi Dasar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nama RS" value={cfg.name || ""} onChange={v => setNested("name", v)} />
          <Field label="Tagline" value={cfg.tagline || ""} onChange={v => setNested("tagline", v)} />
          <ImageField label="Logo" value={cfg.branding?.logo || ""} onChange={v => setNested("branding.logo", v)} onRemove={() => setNested("branding.logo", "")} img={img} field="branding.logo" />
          <ImageField label="Foto Banner" value={cfg.heroImage || ""} onChange={v => setNested("heroImage", v)} onRemove={() => setNested("heroImage", "")} img={img} field="heroImage" />
        </div>
        <div>
          <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Deskripsi</label>
          <textarea value={cfg.profile?.description || ""} onChange={e => setNested("profile.description", e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none min-h-[80px]" />
        </div>
      </div>
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Visi & Misi</h3>
        <div>
          <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Visi</label>
          <textarea value={cfg.profile?.vision || ""} onChange={e => setNested("profile.vision", e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none min-h-[60px]" />
        </div>
        <div>
          <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Misi</label>
          <textarea value={cfg.profile?.mission || ""} onChange={e => setNested("profile.mission", e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none min-h-[60px]" />
        </div>
      </div>
    </div>
  );
}

function ImageField({ label, value, onChange, onRemove, img, field }: {
  label: string; value: string; onChange: (v: string) => void; onRemove: () => void;
  img: any; field: string;
}) {
  return (
    <div className="md:col-span-2">
      <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">{label}</label>
      <div className="flex items-center gap-3 flex-wrap">
        {value && <ImagePreview src={value} onRemove={onRemove} />}
        <button onClick={() => img.doUpload(field, onChange)} disabled={img.uploading[field]}
          className={`px-3 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${img.uploadOk[field] ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
          {img.uploading[field] ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : img.uploadOk[field] ? <CheckCircle size={12} /> : <Upload size={12} />}
          {img.uploading[field] ? "Upload..." : img.uploadOk[field] ? "Berhasil" : "Upload"}
        </button>
      </div>
    </div>
  );
}

function GalleryEditor({ items, onAdd, onRemove, onChange, img }: {
  items: any[]; onAdd: (t: any) => void; onRemove: (i: number) => void;
  onChange: (i: number, f: string, v: string) => void; img: any;
}) {
  const addNew = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append("file", file);
      try {
        const r = await fetch("/api/vendor/upload", { method: "POST", headers: { Authorization: "Bearer " + localStorage.getItem("vps_token") }, body: fd });
        const d = await r.json();
        if (d.url) onAdd({ image: d.url, caption: "", type: "Kegiatan" });
      } catch { alert("Upload gagal"); }
    };
    input.click();
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Galeri ({items.length})</h3>
        <button onClick={addNew} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-blue-700 flex items-center gap-1"><Upload size={10} /> Upload</button>
      </div>
      {items.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4">Belum ada foto. Klik Upload untuk menambah.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item: any, i: number) => (
          <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100 relative">
            <button onClick={() => onRemove(i)} className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 rounded-full text-slate-400 hover:text-red-500 transition-colors shadow-sm"><Trash2 size={12} /></button>
            <div className="flex gap-3">
              <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><Image size={20} /></div>}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <input value={item.caption || ""} onChange={e => onChange(i, "caption", e.target.value)} placeholder="Keterangan"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] outline-none" />
                <input value={item.type || ""} onChange={e => onChange(i, "type", e.target.value)} placeholder="Tipe"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] outline-none" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromoEditor({ items, onAdd, onRemove, onChange, img }: {
  items: any[]; onAdd: (t: any) => void; onRemove: (i: number) => void;
  onChange: (i: number, f: string, v: string) => void; img: any;
}) {
  const addNew = () => {
    onAdd({ type: "Promo", title: "", description: "", image: "" });
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Promo & Berita ({items.length})</h3>
        <button onClick={addNew} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-blue-700 flex items-center gap-1"><Plus size={10} /> Tambah</button>
      </div>
      {items.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4">Belum ada data. Klik Tambah untuk mulai.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item: any, i: number) => (
          <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100 relative">
            <button onClick={() => onRemove(i)} className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 rounded-full text-slate-400 hover:text-red-500 transition-colors shadow-sm"><Trash2 size={12} /></button>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input value={item.type || ""} onChange={e => onChange(i, "type", e.target.value)} placeholder="Tipe"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] outline-none" />
                <div className="flex items-center gap-2">
                  {item.image && <ImagePreview src={item.image} onRemove={() => onChange(i, "image", "")} />}
                  <button onClick={() => img.doUpload(`promotions.${i}.image`, (url: string) => onChange(i, "image", url))} disabled={img.uploading[`promotions.${i}.image`]}
                    className={`px-2 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all flex items-center gap-1 ${img.uploadOk[`promotions.${i}.image`] ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    {img.uploading[`promotions.${i}.image`] ? <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Upload size={10} />}
                    {img.uploadOk[`promotions.${i}.image`] ? "OK" : "Gambar"}
                  </button>
                </div>
              </div>
              <input value={item.title || ""} onChange={e => onChange(i, "title", e.target.value)} placeholder="Judul"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] outline-none" />
              <textarea value={item.description || ""} onChange={e => onChange(i, "description", e.target.value)} placeholder="Deskripsi"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] outline-none min-h-[40px]" rows={2} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || label}
        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none" />
    </div>
  );
}

function ArrayEditor({ title, items, fields, addTemplate, onAdd, onRemove, onChange, renderExtra }: {
  title: string; items: any[]; fields: { key: string; label: string; placeholder: string }[];
  addTemplate: any; onAdd: (t: any) => void; onRemove: (i: number) => void;
  onChange: (i: number, field: string, value: string) => void; renderExtra?: (item: any, i: number) => any;
}) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{title} ({items.length})</h3>
        <button onClick={() => onAdd({ ...addTemplate })} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-blue-700 flex items-center gap-1"><Plus size={10} /> Tambah</button>
      </div>
      {items.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4">Belum ada data. Klik Tambah untuk mulai.</p>}
      <div className="space-y-3">
        {items.map((item: any, i: number) => (
          <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100 relative">
            <button onClick={() => onRemove(i)} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 transition-colors"><X size={12} /></button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-6">
              {fields.map(f => (
                <div key={f.key}>
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 block">{f.label}</label>
                  <input value={item[f.key] || ""} onChange={e => onChange(i, f.key, e.target.value)} placeholder={f.placeholder}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] outline-none" />
                </div>
              ))}
            </div>
            {renderExtra?.(item, i)}
          </div>
        ))}
      </div>
    </div>
  );
}
