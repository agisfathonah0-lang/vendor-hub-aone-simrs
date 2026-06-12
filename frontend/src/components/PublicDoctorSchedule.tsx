import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, Clock, ChevronLeft, User, Stethoscope, Filter } from "lucide-react";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const DAY_MAP: Record<string, string> = { "monday": "Senin", "tuesday": "Selasa", "wednesday": "Rabu", "thursday": "Kamis", "friday": "Jumat", "saturday": "Sabtu", "sunday": "Minggu" };

export default function PublicDoctorSchedule() {
  const { slug } = useParams();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [filterDay, setFilterDay] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const url = filterDay ? `/api/public/${slug}/doctors?day=${filterDay}` : `/api/public/${slug}/doctors`;
    fetch(url).then(r => r.json()).then(d => { setSchedules(d); setLoading(false); }).catch(() => setLoading(false));
  }, [slug, filterDay]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={`/rs/${slug}`} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest"><ChevronLeft size={14} /> Kembali</Link>
          <h1 className="font-black text-sm uppercase tracking-tight text-slate-900">Jadwal Dokter</h1>
          <div />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button onClick={() => setFilterDay("")} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${!filterDay ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-200'}`}><Filter size={12} className="inline mr-1" /> Semua</button>
          {DAYS.map(d => (
            <button key={d} onClick={() => setFilterDay(d)} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${filterDay === d ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-200'}`}>{d}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm font-bold">Belum ada jadwal dokter tersedia</div>
        ) : (
          <div className="space-y-3">
            {schedules.map((s: any, i: number) => {
              const dayName = DAY_MAP[s.day?.toLowerCase()] || s.day || "-";
              return (
                <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">{s.doctorName?.charAt(0) || s.doctor_name?.charAt(0) || "?"}</div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{s.doctorName || s.doctor_name || "-"}</h3>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><Stethoscope size={10} /> {s.specialty || s.poly || "-"}</span>
                        <span className="flex items-center gap-1"><Calendar size={10} /> {dayName}</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {s.startTime || s.start_time || "-"} — {s.endTime || s.end_time || "-"}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${s.status === 'active' ? 'bg-emerald-100 text-emerald-600' : s.status === 'full' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>{s.status || "Active"}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
