import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, Clock, ChevronLeft, User, Stethoscope, Send, CheckCircle, AlertCircle } from "lucide-react";
import { useSEO } from "../lib/useSEO";

const FALLBACK_DEPARTMENTS = ["Poli Umum", "Poli Gigi", "Poli Anak", "Poli Kandungan", "Poli Mata", "Poli THT", "Poli Saraf", "Poli Jantung", "Poli Kulit", "IGD"];

export default function OnlineQueue() {
  const { slug } = useParams();
  const [form, setForm] = useState({ name: "", nik: "", phone: "", department: "", complaint: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; queueNumber?: string; error?: string }>({});
  const [meta, setMeta] = useState<any>(null);
  const [polyclinics, setPolyclinics] = useState<string[]>([]);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public/${slug}/home`).then(r => r.json()).then(d => {
      setMeta(d.institution);
      const list = d.config?.polyclinics || [];
      setPolyclinics(list.map((p: any) => p.name).filter(Boolean));
    }).catch(() => {
      fetch(`/api/public/${slug}/meta`).then(r => r.json()).then(d => setMeta(d)).catch(() => {});
    });
  }, [slug]);

  useSEO(meta ? `Antrian Online — ${meta.name}` : "Antrian Online", `Ambil nomor antrian online di ${meta?.name || slug} — daftar antrian tanpa datang langsung.`);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.department) return;
    setSubmitting(true);
    setResult({});
    try {
      const r = await fetch(`/api/public/${slug}/queue/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: form.name,
          patientNik: form.nik,
          patientPhone: form.phone,
          department: form.department,
          complaint: form.complaint,
        }),
      });
      const d = await r.json();
      if (d.success) setResult({ success: true, queueNumber: d.queueNumber });
      else setResult({ error: d.error || "Gagal mendaftar." });
    } catch { setResult({ error: "Gagal menghubungi server." }); }
    setSubmitting(false);
  };

  if (result.success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-6"><CheckCircle size={40} className="text-emerald-600" /></div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Pendaftaran Berhasil</h1>
          <p className="text-slate-400 text-sm mb-6">Silakan datang ke RS dan tunjukkan nomor antrian Anda.</p>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nomor Antrian</p>
            <p className="text-4xl font-black text-blue-600">{result.queueNumber || "-"}</p>
          </div>
          <Link to={`/rs/${slug}`} className="text-blue-600 text-sm font-bold hover:underline">Kembali ke halaman utama</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={`/rs/${slug}`} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest"><ChevronLeft size={14} /> Kembali</Link>
          <h1 className="font-black text-sm uppercase tracking-tight text-slate-900">Antrian Online</h1>
          <div />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Calendar size={20} className="text-blue-600" /></div>
            <div><h2 className="font-bold text-sm text-slate-900">Daftar Antrian</h2><p className="text-[10px] text-slate-400">Isi data diri untuk mendapatkan nomor antrian</p></div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Nama Lengkap *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Nama pasien" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">NIK</label>
                <input value={form.nik} onChange={e => setForm({...form, nik: e.target.value})} placeholder="Nomor Induk Kependudukan" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">No. Telepon</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="08xxx" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Poli Tujuan *</label>
                <select value={form.department} onChange={e => setForm({...form, department: e.target.value})} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="">-- Pilih Poli --</option>
                  {(polyclinics.length ? polyclinics : FALLBACK_DEPARTMENTS).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Keluhan</label>
                <textarea value={form.complaint} onChange={e => setForm({...form, complaint: e.target.value})} rows={3} placeholder="Deskripsi keluhan (opsional)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
              </div>
            </div>

            {result.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-[11px]">
                <AlertCircle size={14} /> {result.error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Send size={14} /> Daftar Antrian</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
