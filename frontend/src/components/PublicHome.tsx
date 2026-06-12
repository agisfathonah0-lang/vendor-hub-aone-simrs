import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Building2, Phone, MapPin, Clock, Calendar, ArrowRight, Shield, Activity, Stethoscope, Syringe, Microscope, Heart, ExternalLink } from "lucide-react";

export default function PublicHome() {
  const { slug } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public/${slug}/home`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-slate-400 text-sm">RS tidak ditemukan</p></div>;

  const { institution: inst, config } = data;
  const brand = config?.branding || {};
  const profile = config?.profile || {};
  const services = config?.services || [];
  const promos = config?.promotions || [];
  const hours = config?.operationalHours || [];

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
          <div className="flex gap-3 mt-8">
            <Link to={`/rs/${slug}/jadwal-dokter`} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all">Jadwal Dokter</Link>
            <Link to={`/rs/${slug}/hasil-lab`} className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all">Hasil Lab</Link>
            <Link to={`/rs/${slug}/antrian`} className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all">Antrian Online</Link>
          </div>
        </div>
      </section>

      {/* LAYANAN */}
      {services.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Layanan Kami</h2>
          <p className="text-slate-400 text-sm mb-8">Berbagai layanan kesehatan tersedia untuk Anda</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map((s: any, i: number) => (
              <div key={i} className="p-5 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                  {i % 4 === 0 ? <Stethoscope size={18} className="text-blue-600" /> : i % 4 === 1 ? <Activity size={18} className="text-blue-600" /> : i % 4 === 2 ? <Microscope size={18} className="text-blue-600" /> : <Heart size={18} className="text-blue-600" />}
                </div>
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-tight">{s.name || s}</h3>
                {s.description && <p className="text-[10px] text-slate-400 mt-1">{s.description}</p>}
              </div>
            ))}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {promos.map((p: any, i: number) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-2">{p.type || "Promo"}</div>
                <h3 className="font-bold text-sm text-slate-900 mb-2">{p.title}</h3>
                <p className="text-[11px] text-slate-500">{p.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-[10px] text-slate-400">
          <span>&copy; 2026 {config?.name || inst.name}</span>
          <span className="text-slate-600">Powered by AONE TRUST SIMRS</span>
        </div>
      </footer>
    </div>
  );
}
