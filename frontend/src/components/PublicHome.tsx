import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Building2, Phone, MapPin, Clock, Calendar, ArrowRight, Shield, Activity,
  Stethoscope, Microscope, Heart, ExternalLink, ChevronDown, ChevronRight,
  Award, Image, Users, ChevronLeft, ChevronRight as ChevronRightIcon
} from "lucide-react";

const SERVICE_ICONS = [Stethoscope, Activity, Microscope, Heart, Shield, Calendar];

export default function PublicHome() {
  const { slug } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [galIdx, setGalIdx] = useState(0);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public/${slug}/home`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-slate-400 text-sm">RS tidak ditemukan</p></div>;

  const { institution: inst, config } = data;
  const brand = config?.branding || {};
  const profile = config?.profile || {};
  const services = config?.services || [];
  const promos = config?.promotions || [];
  const hours = config?.operationalHours || [];
  const gallery = config?.gallery || [];
  const orgStructure = config?.organizationStructure || [];
  const polyclinics = config?.polyclinics || [];

  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="max-w-6xl mx-auto px-6 py-20 relative">
          <div className="flex items-center gap-4 mb-8">
            {brand?.logo ? <img src={brand.logo} className="w-16 h-16 rounded-2xl" alt="" />
              : <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center"><Building2 size={32} /></div>}
            <div>
              <h1 className="text-4xl font-black tracking-tight">{config?.name || inst.name}</h1>
              <p className="text-blue-200/60 mt-1">{config?.tagline || profile?.description || `RS ${inst.type}`}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-blue-200/60">
            {inst.address && <span className="flex items-center gap-2"><MapPin size={14} /> {inst.address}, {inst.city}</span>}
            {inst.phone && <span className="flex items-center gap-2"><Phone size={14} /> {inst.phone}</span>}
          </div>
          <div className="flex gap-3 mt-8 flex-wrap">
            <Link to={`/rs/${slug}/jadwal-dokter`} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all">Jadwal Dokter</Link>
            <Link to={`/rs/${slug}/hasil-lab`} className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all">Hasil Lab</Link>
            <Link to={`/rs/${slug}/antrian`} className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all">Antrian Online</Link>
          </div>
        </div>
      </section>

      {/* TENTANG */}
      {(profile?.description || profile?.vision || profile?.mission) && (
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Tentang Kami</h2>
          <p className="text-slate-400 text-sm mb-8">Profil dan visi misi {config?.name || inst.name}</p>
          {profile.description && <p className="text-slate-600 text-sm leading-relaxed mb-6">{profile.description}</p>}
          {(profile.vision || profile.mission) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.vision && (
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <h3 className="font-black text-xs text-blue-700 uppercase tracking-widest mb-2">Visi</h3>
                  <p className="text-sm text-slate-700">{profile.vision}</p>
                </div>
              )}
              {profile.mission && (
                <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                  <h3 className="font-black text-xs text-emerald-700 uppercase tracking-widest mb-2">Misi</h3>
                  <p className="text-sm text-slate-700">{profile.mission}</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* GALLERY */}
      {gallery.length > 0 && (
        <section className="bg-slate-50 py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Galeri & Prestasi</h2>
            <p className="text-slate-400 text-sm mb-8">Kegiatan dan pencapaian kami</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {gallery.map((g: any, i: number) => (
                <div key={i} className="group relative bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                  {g.image ? (
                    <img src={g.image} alt={g.caption || ""} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center"><Image size={40} className="text-blue-300" /></div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <span className="text-[9px] font-bold text-blue-300 uppercase tracking-widest">{g.type || "Kegiatan"}</span>
                    {g.caption && <p className="text-white text-sm font-bold mt-0.5">{g.caption}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* POLI & SPESIALIS */}
      {polyclinics.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Poli & Spesialis</h2>
          <p className="text-slate-400 text-sm mb-8">Layanan poli dan tenaga spesialis kami</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {polyclinics.map((p: any, i: number) => (
              <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                  <Users size={18} className="text-blue-600" />
                </div>
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-tight mb-2">{p.name}</h3>
                {p.description && <p className="text-[10px] text-slate-400 mb-3">{p.description}</p>}
                {p.specialists && p.specialists.length > 0 && (
                  <div className="space-y-1">
                    {p.specialists.map((sp: string, j: number) => (
                      <div key={j} className="flex items-center gap-2 text-[10px] text-slate-600"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" />{sp}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* STRUKTUR ORGANISASI */}
      {orgStructure.length > 0 && (
        <section className="bg-slate-50 py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Struktur Organisasi</h2>
            <p className="text-slate-400 text-sm mb-8">Bagan kepemimpinan {config?.name || inst.name}</p>
            <OrgNode node={orgStructure[0]} level={0} />
          </div>
        </section>
      )}

      {/* LAYANAN */}
      {services.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Layanan Kami</h2>
          <p className="text-slate-400 text-sm mb-8">Berbagai layanan kesehatan tersedia untuk Anda</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map((s: any, i: number) => {
              const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
              return (
                <div key={i} className="p-5 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3"><Icon size={18} className="text-blue-600" /></div>
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-tight">{s.name || s}</h3>
                  {s.description && <p className="text-[10px] text-slate-400 mt-1">{s.description}</p>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* JAM OPERASIONAL */}
      {hours.length > 0 && (
        <section className="bg-slate-50 py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Jam Operasional</h2>
            <p className="text-slate-400 text-sm mb-8">Kami siap melayani Anda</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {hours.map((h: any, i: number) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 uppercase">{h.day || h.hari}</span>
                  <span className="text-[11px] text-slate-500">{h.open || h.buka} — {h.close || h.tutup}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PROMO */}
      {promos.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Promo & Berita</h2>
          <p className="text-slate-400 text-sm mb-8">Informasi terbaru dari kami</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {promos.map((p: any, i: number) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-bold uppercase tracking-widest mb-3">{p.type || "Info"}</span>
                {p.image && <img src={p.image} alt={p.title} className="w-full h-32 object-cover rounded-lg mb-3" />}
                <h3 className="font-bold text-xs text-slate-900 mb-2">{p.title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-black text-sm uppercase tracking-tight mb-3">{config?.name || inst.name}</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">{profile?.description || ""}</p>
            </div>
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-300 mb-3">Kontak</h4>
              <div className="space-y-2 text-[10px] text-slate-400">
                {inst.address && <p className="flex items-center gap-2"><MapPin size={10} /> {inst.address}</p>}
                {inst.phone && <p className="flex items-center gap-2"><Phone size={10} /> {inst.phone}</p>}
                {inst.email && <p className="flex items-center gap-2">{inst.email}</p>}
              </div>
            </div>
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-300 mb-3">Layanan Online</h4>
              <div className="space-y-2">
                <Link to={`/rs/${slug}/jadwal-dokter`} className="block text-[10px] text-slate-400 hover:text-white transition-colors">Jadwal Dokter</Link>
                <Link to={`/rs/${slug}/hasil-lab`} className="block text-[10px] text-slate-400 hover:text-white transition-colors">Hasil Lab</Link>
                <Link to={`/rs/${slug}/antrian`} className="block text-[10px] text-slate-400 hover:text-white transition-colors">Antrian Online</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex items-center justify-between text-[9px] text-slate-600">
            <span>&copy; 2026 {config?.name || inst.name}</span>
            <div className="flex items-center gap-3">
              <Link to={`/rs/${slug}/admin`} className="hover:text-white transition-colors">Panel Admin</Link>
              <span className="text-slate-700">Powered by AONE TRUST SIMRS</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function OrgNode({ node, level }: { node: any; level: number }) {
  const [open, setOpen] = useState(level < 2);
  if (!node) return null;
  return (
    <div className="ml-0">
      <div className="flex items-center gap-2 py-2">
        {node.children?.length > 0 && (
          <button onClick={() => setOpen(!open)} className="text-slate-300 hover:text-slate-500 transition-colors">
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        )}
        <div className={`px-4 py-2 rounded-lg font-bold text-xs ${
          level === 0 ? "bg-slate-900 text-white text-sm" :
          level === 1 ? "bg-blue-100 text-blue-700" :
          level === 2 ? "bg-slate-100 text-slate-700" :
          "bg-slate-50 text-slate-500"
        }`}>
          {node.position || node.jabatan}
          {node.name && <span className="font-normal ml-2 opacity-70">— {node.name}</span>}
        </div>
      </div>
      {open && node.children && (
        <div className="border-l-2 border-slate-200 ml-3 pl-4">
          {node.children.map((child: any, i: number) => (
            <OrgNode key={i} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
