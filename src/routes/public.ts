import { Router } from "express";
import { query } from "../db.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();

function getInstitutionId(host: string): Promise<string | null> {
  const hostname = host?.split(':')[0]?.toLowerCase();
  const slug = hostname?.split('.')[0];
  if (!slug || slug === 'localhost' || slug === '127' || slug === '0') return Promise.resolve(null);
  return query(
    "SELECT id FROM institutions WHERE url_slug = $1 OR domain = $2 LIMIT 1",
    [slug, hostname]
  ).then(r => r.rowCount ? r.rows[0].id : null).catch(() => null);
}

router.get("/:slug/home", async (req, res) => {
  try {
    const { slug } = req.params;
    const [inst, config] = await Promise.all([
      query("SELECT id, name, type, address, city, province, phone, email FROM institutions WHERE url_slug = $1", [slug]),
      query("SELECT data FROM rs_public_config WHERE institution_id = (SELECT id FROM institutions WHERE url_slug = $1)", [slug]),
    ]);
    if (!inst.rowCount) return res.status(404).json({ error: "RS tidak ditemukan." });
    res.json({
      institution: inst.rows[0],
      config: config.rows[0]?.data || {},
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/:slug/doctors", async (req, res) => {
  try {
    const { slug } = req.params;
    const { day } = req.query;
    const inst = await query("SELECT id FROM institutions WHERE url_slug = $1", [slug]);
    if (!inst.rowCount) return res.status(404).json({ error: "RS tidak ditemukan." });
    const rsId = inst.rows[0].id;
    let sql = "SELECT data FROM rs_doctor_schedules WHERE institution_id = $1";
    const params: any[] = [rsId];
    if (day) {
      sql += " AND data->>'day' = $2";
      params.push(day);
    }
    sql += " ORDER BY data->>'day', data->>'startTime'";
    const schedules = await query(sql, params);
    res.json(schedules.rows.map(r => r.data));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/:slug/lab/:noRm", async (req, res) => {
  try {
    const { slug, noRm } = req.params;
    const inst = await query("SELECT id FROM institutions WHERE url_slug = $1", [slug]);
    if (!inst.rowCount) return res.status(404).json({ error: "RS tidak ditemukan." });
    const rsId = inst.rows[0].id;
    const results = await query(
      "SELECT data FROM rs_lab_results WHERE institution_id = $1 AND no_rm = $2 ORDER BY created_at DESC",
      [rsId, noRm]
    );
    res.json({ results: results.rows.map(r => r.data), count: results.rowCount });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/:slug/queue/register", async (req, res) => {
  try {
    const { slug } = req.params;
    const { patientName, patientNik, patientPhone, department, complaint } = req.body;
    if (!patientName || !department) return res.status(400).json({ success: false, error: "Nama dan poli wajib diisi." });
    const inst = await query("SELECT id, name FROM institutions WHERE url_slug = $1", [slug]);
    if (!inst.rowCount) return res.status(404).json({ success: false, error: "RS tidak ditemukan." });
    const rsId = inst.rows[0].id;
    const today = new Date().toISOString().slice(0, 10);
    const count = await query("SELECT COUNT(*) as cnt FROM public_queues WHERE institution_id = $1 AND booking_date = $2", [rsId, today]);
    const seq = (parseInt(count.rows[0].cnt) + 1).toString().padStart(3, "0");
    const queueNumber = `${department.replace(/[^A-Z]/gi, "").slice(0, 3).toUpperCase()}-${seq}`;
    await query(
      `INSERT INTO public_queues (id, institution_id, patient_name, patient_nik, patient_phone, department, queue_number, status, source, booking_date, doctor_name, booking_time)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'waiting','online',$8,'-',CURRENT_TIME)`,
      [uuidv4(), rsId, patientName, patientNik || null, patientPhone || null, department, queueNumber, today]
    );
    res.json({ success: true, queueNumber });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/:slug/queue", async (req, res) => {
  try {
    const { slug } = req.params;
    const inst = await query("SELECT id, name FROM institutions WHERE url_slug = $1", [slug]);
    if (!inst.rowCount) return res.status(404).json({ error: "RS tidak ditemukan." });
    const rsId = inst.rows[0].id;
    const queues = await query(
      "SELECT id, patient_name, department, doctor_name, queue_number, status, booking_date, booking_time, created_at FROM public_queues WHERE institution_id = $1 AND status = 'waiting' ORDER BY created_at",
      [rsId]
    );
    res.json({ institution: inst.rows[0].name, queues: queues.rows });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/:slug/meta", async (req, res) => {
  try {
    const { slug } = req.params;
    const inst = await query(
      `SELECT i.name, i.city, i.type, c.data->>'tagline' as tagline, c.data->'profile'->>'description' as description
       FROM institutions i LEFT JOIN rs_public_config c ON i.id = c.institution_id
       WHERE i.url_slug = $1`,
      [slug]
    );
    if (!inst.rowCount) return res.status(404).json({ error: "RS tidak ditemukan." });
    res.json(inst.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
