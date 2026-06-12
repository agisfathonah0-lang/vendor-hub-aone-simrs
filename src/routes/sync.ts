import { Router } from "express";
import { query } from "../db.js";

const router = Router();

// Verify sender is a valid RS
async function verifyRs(req: any, res: any, next: any) {
  const token = req.headers["x-sync-token"];
  const rsId = req.headers["x-rs-id"];
  if (!token || !rsId) return res.status(401).json({ error: "x-sync-token dan x-rs-id diperlukan." });
  try {
    const result = await query(
      "SELECT tunnel_token FROM tunnel_registrations WHERE rs_id = $1 AND tunnel_token = $2",
      [rsId, token]
    );
    if (!result.rowCount) return res.status(403).json({ error: "Token tidak valid." });
    (req as any).rsId = rsId;
    next();
  } catch { return res.status(500).json({ error: "Verifikasi gagal." }); }
}

router.use(verifyRs);

router.post("/config", async (req, res) => {
  try {
    const { config } = req.body;
    await query(
      `INSERT INTO rs_public_config (institution_id, data, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (institution_id) DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP`,
      [(req as any).rsId, JSON.stringify(config || {})]
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/doctor-schedules", async (req, res) => {
  try {
    const { schedules } = req.body;
    if (!Array.isArray(schedules)) return res.status(400).json({ error: "schedules harus array." });
    const rsId = (req as any).rsId;
    await query("DELETE FROM rs_doctor_schedules WHERE institution_id = $1", [rsId]);
    for (const s of schedules) {
      const id = s.id || `SCH-${rsId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      await query(
        `INSERT INTO rs_doctor_schedules (id, institution_id, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET data = $3`,
        [id, rsId, JSON.stringify(s)]
      );
    }
    res.json({ success: true, count: schedules.length });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/lab-results", async (req, res) => {
  try {
    const { results } = req.body;
    if (!Array.isArray(results)) return res.status(400).json({ error: "results harus array." });
    const rsId = (req as any).rsId;
    for (const r of results) {
      const id = r.id || `LAB-${rsId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      await query(
        `INSERT INTO rs_lab_results (id, institution_id, no_rm, patient_name, data)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET data = $5`,
        [id, rsId, r.no_rm, r.patient_name || "", JSON.stringify(r)]
      );
    }
    res.json({ success: true, count: results.length });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
