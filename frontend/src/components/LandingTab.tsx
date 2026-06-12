import { useState, useEffect, useCallback } from "react";
import { Globe, Save, Plus, X, GripVertical, Upload, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { apiFetch, cn } from "../lib/utils";

type Section = "menu" | "hero" | "stats" | "audiences" | "features" | "screenshots" | "testimonials" | "contact" | "footer";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "menu", label: "Menu" },
  { id: "hero", label: "Hero" },
  { id: "stats", label: "Statistik" },
  { id: "audiences", label: "Target Audiens" },
  { id: "features", label: "Fitur" },
  { id: "screenshots", label: "Screenshot" },
  { id: "testimonials", label: "Testimoni" },
  { id: "contact", label: "Kontak" },
  { id: "footer", label: "Footer" },
];

const DEFAULT_CONFIG: any = {
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
  contact: {
    phone: "0812-3456-7890",
    email: "info@aone-trust.com",
    address: "Jakarta, Indonesia",
  },
  footer: {
    description: "Platform SIMRS terintegrasi untuk vendor dan institusi kesehatan di seluruh Indonesia. Keamanan enterprise, kelola banyak tempat dari satu dashboard.",
    copyright: "© 2026 AONE TRUST SIMRS. All rights reserved.",
  },
};

function Input(props: any) {
  return <input {...props} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-300" />;
}

function Textarea(props: any) {
  return <textarea {...props} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-300 min-h-[60px] resize-y" />;
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{children}</label>;
}

function ArrayEditor({ items, onChange, fields, label }: {
  items: any[];
  onChange: (items: any[]) => void;
  fields: { key: string; label: string; type?: "text" | "textarea" }[];
  label: string;
}) {
  const add = () => {
    const obj: any = {};
    fields.forEach(f => obj[f.key] = "");
    onChange([...items, obj]);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i: number, key: string, val: string) => {
    const copy = items.map((item, idx) => idx === i ? { ...item, [key]: val } : item);
    onChange(copy);
  };
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label} #{i + 1}</span>
            <button onClick={() => remove(i)} className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 transition-all"><X size={12} /></button>
          </div>
          <div className="space-y-2">
            {fields.map(f => (
              <div key={f.key}>
                <Label>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea value={item[f.key] || ""} onChange={(e: any) => update(i, f.key, e.target.value)} />
                ) : (
                  <Input value={item[f.key] || ""} onChange={(e: any) => update(i, f.key, e.target.value)} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={add} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-[9px] font-bold text-slate-400 uppercase tracking-wider hover:border-blue-300 hover:text-blue-600 transition-all flex items-center justify-center gap-1"><Plus size={12} /> Tambah {label}</button>
    </div>
  );
}

export default function LandingTab() {
  const [section, setSection] = useState<Section>("hero");
  const [cfg, setCfg] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch("/api/vendor/landing-config").then(d => {
      setCfg(d && typeof d === "object" && !d.error ? { ...DEFAULT_CONFIG, ...d } : { ...DEFAULT_CONFIG });
    }).catch(() => setCfg({ ...DEFAULT_CONFIG }));
  }, []);

  const update = useCallback((path: string, val: any) => {
    setCfg((prev: any) => {
      const copy = { ...prev };
      const keys = path.split(".");
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = val;
      return copy;
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/vendor/landing-config", {
        method: "PUT",
        body: JSON.stringify({ data: cfg }),
      });
      if (res?.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err: any) { alert(err.message); }
    setSaving(false);
  };

  if (!cfg) return <div className="p-8 text-center text-xs text-slate-400">Memuat...</div>;

  const renderEditor = () => {
    switch (section) {
      case "menu":
        return (
          <div>
            <p className="text-[10px] text-slate-400 mb-4">Menu navigasi yang tampil di navbar landing page.</p>
            <ArrayEditor label="Menu" items={cfg.menu || []} onChange={(v) => update("menu", v)} fields={[
              { key: "label", label: "Label" },
              { key: "href", label: "Tautan (href)" },
            ]} />
          </div>
        );

      case "hero":
        return (
          <div className="space-y-3">
            <p className="text-[10px] text-slate-400 mb-4">Bagian hero/header utama landing page.</p>
            <div><Label>Badge</Label><Input value={cfg.hero?.badge || ""} onChange={(e) => update("hero.badge", e.target.value)} /></div>
            <div><Label>Baris Judul 1</Label><Input value={cfg.hero?.titleLine1 || ""} onChange={(e) => update("hero.titleLine1", e.target.value)} /></div>
            <div><Label>Baris Judul 2</Label><Input value={cfg.hero?.titleLine2 || ""} onChange={(e) => update("hero.titleLine2", e.target.value)} /></div>
            <div><Label>Teks Highlight (warna biru)</Label><Input value={cfg.hero?.titleHighlight || ""} onChange={(e) => update("hero.titleHighlight", e.target.value)} /></div>
            <div><Label>Subtitle</Label><Textarea value={cfg.hero?.subtitle || ""} onChange={(e) => update("hero.subtitle", e.target.value)} /></div>
            <div><Label>Tombol Utama</Label><Input value={cfg.hero?.ctaPrimary || ""} onChange={(e) => update("hero.ctaPrimary", e.target.value)} /></div>
            <div><Label>Tombol Sekunder</Label><Input value={cfg.hero?.ctaSecondary || ""} onChange={(e) => update("hero.ctaSecondary", e.target.value)} /></div>
          </div>
        );

      case "stats":
        return (
          <div>
            <p className="text-[10px] text-slate-400 mb-4">Angka statistik di bawah hero.</p>
            <ArrayEditor label="Statistik" items={cfg.stats || []} onChange={(v) => update("stats", v)} fields={[
              { key: "label", label: "Label" },
              { key: "value", label: "Nilai" },
            ]} />
          </div>
        );

      case "audiences":
        return (
          <div>
            <p className="text-[10px] text-slate-400 mb-4">Target audiens/kategori institusi yang dilayani. (Icon diatur tetap oleh sistem)</p>
            <ArrayEditor label="Audiens" items={cfg.audiences || []} onChange={(v) => update("audiences", v)} fields={[
              { key: "title", label: "Judul" },
              { key: "desc", label: "Deskripsi", type: "textarea" },
            ]} />
          </div>
        );

      case "features":
        return (
          <div>
            <p className="text-[10px] text-slate-400 mb-4">Fitur-fitur unggulan. (Icon dan warna diatur tetap oleh sistem)</p>
            <ArrayEditor label="Fitur" items={cfg.features || []} onChange={(v) => update("features", v)} fields={[
              { key: "title", label: "Judul" },
              { key: "desc", label: "Deskripsi", type: "textarea" },
            ]} />
          </div>
        );

      case "screenshots":
        return (
          <div>
            <p className="text-[10px] text-slate-400 mb-4">Cuplikan gambar tampilan aplikasi.</p>
            <ArrayEditor label="Screenshot" items={cfg.screenshots || []} onChange={(v) => update("screenshots", v)} fields={[
              { key: "label", label: "Label" },
              { key: "desc", label: "Keterangan" },
            ]} />
          </div>
        );

      case "testimonials":
        return (
          <div>
            <p className="text-[10px] text-slate-400 mb-4">Testimoni dari pengguna.</p>
            <ArrayEditor label="Testimoni" items={cfg.testimonials || []} onChange={(v) => update("testimonials", v)} fields={[
              { key: "quote", label: "Kutipan", type: "textarea" },
              { key: "name", label: "Nama" },
              { key: "role", label: "Jabatan" },
            ]} />
          </div>
        );

      case "contact":
        return (
          <div className="space-y-3">
            <p className="text-[10px] text-slate-400 mb-4">Informasi kontak yang tampil di section konsultasi gratis.</p>
            <div><Label>Telepon</Label><Input value={cfg.contact?.phone || ""} onChange={(e) => update("contact.phone", e.target.value)} /></div>
            <div><Label>Email</Label><Input value={cfg.contact?.email || ""} onChange={(e) => update("contact.email", e.target.value)} /></div>
            <div><Label>Alamat</Label><Input value={cfg.contact?.address || ""} onChange={(e) => update("contact.address", e.target.value)} /></div>
          </div>
        );

      case "footer":
        return (
          <div className="space-y-3">
            <p className="text-[10px] text-slate-400 mb-4">Teks footer landing page.</p>
            <div><Label>Deskripsi</Label><Textarea value={cfg.footer?.description || ""} onChange={(e) => update("footer.description", e.target.value)} /></div>
            <div><Label>Copyright</Label><Input value={cfg.footer?.copyright || ""} onChange={(e) => update("footer.copyright", e.target.value)} /></div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-2"><Globe size={18} className="text-blue-600" /> Landing Page</h2>
        <div className="flex items-center gap-2">
          <Link to="/" className="px-3 py-1.5 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-1.5" target="_blank"><Eye size={12} /> Lihat Halaman</Link>
          <button onClick={save} disabled={saving} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-1.5">
            <Save size={12} /> {saving ? "Menyimpan..." : "Simpan"}
          </button>
          {saved && <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Tersimpan!</span>}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap border-b border-slate-200 pb-3">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} className={cn(
            "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
            section === s.id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-100 border border-transparent"
          )}>{s.label}</button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        {renderEditor()}
      </div>
    </div>
  );
}
