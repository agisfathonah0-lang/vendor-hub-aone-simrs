import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Search, FileText, ChevronLeft, Microscope, Calendar, AlertCircle } from "lucide-react";

export default function PublicLabResult() {
  const { slug } = useParams();
  const [noRm, setNoRm] = useState("");
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async () => {
    if (!noRm.trim()) return;
    setLoading(true); setError(""); setResults(null);
    try {
      const r = await fetch(`/api/public/${slug}/lab/${noRm.trim()}`);
      const d = await r.json();
      if (d.results?.length > 0) setResults(d.results);
      else setError("Hasil laboratorium tidak ditemukan untuk No. RM ini.");
    } catch { setError("Gagal memuat data."); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={`/rs/${slug}`} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest"><ChevronLeft size={14} /> Kembali</Link>
          <h1 className="font-black text-sm uppercase tracking-tight text-slate-900">Hasil Laboratorium</h1>
          <div />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white p-6 rounded-xl border border-slate-200 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><Microscope size={20} className="text-purple-600" /></div>
            <div><h2 className="font-bold text-sm text-slate-900">Cek Hasil Lab</h2><p className="text-[10px] text-slate-400">Masukkan No. Rekam Medis untuk melihat hasil laboratorium</p></div>
          </div>
          <div className="flex gap-2">
            <input value={noRm} onChange={e => setNoRm(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder="Masukkan No. RM (contoh: RM-001)" className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20" />
            <button onClick={search} disabled={loading || !noRm.trim()} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Search size={14} /> Cari</>}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-700 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {results && results.length > 0 && (
          <div className="space-y-4">
            {results.map((r: any, i: number) => (
              <div key={i} className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-purple-500" />
                    <span className="font-bold text-xs text-slate-900">Hasil Lab — {r.patientName || r.patient_name || "-"}</span>
                  </div>
                  {r.tanggal && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Calendar size={10} /> {new Date(r.tanggal).toLocaleDateString("id-ID")}</span>}
                </div>

                {r.examinations || r.pemeriksaan ? (
                  <table className="w-full text-left text-[11px]">
                    <thead><tr className="border-b border-slate-100"><th className="py-2 font-bold text-slate-500 uppercase tracking-wider">Pemeriksaan</th><th className="py-2 font-bold text-slate-500 uppercase tracking-wider">Hasil</th><th className="py-2 font-bold text-slate-500 uppercase tracking-wider">Satuan</th><th className="py-2 font-bold text-slate-500 uppercase tracking-wider">Nilai Normal</th></tr></thead>
                    <tbody>
                      {(r.examinations || r.pemeriksaan || []).map((e: any, j: number) => (
                        <tr key={j} className="border-b border-slate-50">
                          <td className="py-2 text-slate-700 font-medium">{e.name || e.nama || e.pemeriksaan || "-"}</td>
                          <td className={`py-2 font-bold ${e.flag === 'H' ? 'text-red-600' : e.flag === 'L' ? 'text-blue-600' : 'text-slate-900'}`}>{e.result || e.hasil || "-"}</td>
                          <td className="py-2 text-slate-400">{e.unit || e.satuan || "-"}</td>
                          <td className="py-2 text-slate-400">{e.normalRange || e.normal || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <pre className="text-[11px] text-slate-600 whitespace-pre-wrap">{JSON.stringify(r, null, 2)}</pre>
                )}
              </div>
            ))}
          </div>
        )}

        {results && results.length === 0 && !error && (
          <div className="text-center py-12 text-slate-400 text-sm font-bold">Tidak ada hasil laboratorium ditemukan</div>
        )}
      </div>
    </div>
  );
}
