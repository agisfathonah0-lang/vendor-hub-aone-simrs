/**
 * Public API — daftar institusi untuk landing page.
 * Semua fitur antrian, login dokter/pasien, dan jadwal
 * ada di server RS masing-masing, BUKAN di VPS Hub.
 */
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

// Daftar institusi (untuk landing page VPS Hub)
router.get("/institutions", async (_req, res) => {
  try {
    const result = await query(
      "SELECT id, name, type, address, city, province, phone, status, rs_online, url_slug, domain FROM institutions WHERE status = 'active' ORDER BY name"
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
