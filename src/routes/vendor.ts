/**
 * Vendor Hub Routes — Super Admin manage semua RS.
 */
import { Router } from "express";
import { query } from "../db.js";
const verifyLimiter = new Map<string, { count: number; resetAt: number }>();
import crypto from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getOnlineRs } from "../tunnel/manager.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = path.join(__dirname, "../../data/vps_tokens.json");

// Token storage
const tokens = new Map<string, { userId: string; email: string; expiry: number }>();

function loadTokens() {
  try {
    if (existsSync(TOKEN_FILE)) {
      const data = JSON.parse(readFileSync(TOKEN_FILE, "utf8"));
      Object.entries(data).forEach(([k, v]: any) => tokens.set(k, v));
    }
  } catch {}
}

function saveTokens() {
  try {
    const dir = path.dirname(TOKEN_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(TOKEN_FILE, JSON.stringify(Object.fromEntries(tokens)), "utf8");
  } catch {}
}

loadTokens();

function generateToken(): string {
  return crypto.randomUUID();
}

export function verifyToken(token: string) {
  const entry = tokens.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiry) { tokens.delete(token); saveTokens(); return null; }
  return entry;
}

const router = Router();

// Auth middleware
router.use((req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const entry = verifyToken(token);
    if (entry) (req as any).vpsUser = entry;
  }
  next();
});

async function requireSuperAdmin(req: any, res: any, next: any) {
  if (!(req as any).vpsUser) return res.status(401).json({ error: "Unauthorized" });
  try {
    const result = await query("SELECT role FROM users WHERE user_id = $1", [req.vpsUser.userId]);
    if (!result.rowCount || result.rows[0].role !== "super_admin")
      return res.status(403).json({ error: "Forbidden: only super_admin" });
    next();
  } catch { return res.status(500).json({ error: "Auth check failed" }); }
}

async function requireAdmin(req: any, res: any, next: any) {
  if (!(req as any).vpsUser) return res.status(401).json({ error: "Unauthorized" });
  try {
    const result = await query("SELECT role, institution_id FROM users WHERE user_id = $1", [req.vpsUser.userId]);
    if (!result.rowCount) return res.status(403).json({ error: "User not found" });
    const role = result.rows[0].role;
    if (!["super_admin", "admin_rs"].includes(role)) return res.status(403).json({ error: "Forbidden" });
    (req as any).userRole = role;
    (req as any).userInstId = result.rows[0].institution_id;
    next();
  } catch { return res.status(500).json({ error: "Auth check failed" }); }
}

// Auth
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email dan password diperlukan." });
  try {
    const result = await query(
      "SELECT u.user_id, u.email, u.display_name, u.role, u.institution_id, u.password_hash, i.url_slug FROM users u LEFT JOIN institutions i ON u.institution_id = i.id WHERE u.email = $1",
      [email]
    );
    if (!result.rowCount) return res.status(401).json({ error: "Email atau password salah." });
    const u = result.rows[0];
    if (u.status === "suspended") return res.status(403).json({ error: "Akun dinonaktifkan." });
    if (!["super_admin", "admin_rs"].includes(u.role)) return res.status(403).json({ error: "Akses ditolak." });
    const hash = crypto.scryptSync(password, u.user_id.slice(0, 16), 64).toString("hex");
    if (hash !== u.password_hash) return res.status(401).json({ error: "Email atau password salah." });
    const tokenStr = generateToken();
    const expiry = Date.now() + 24 * 3600 * 1000;
    tokens.set(tokenStr, { userId: u.user_id, email: u.email, expiry });
    saveTokens();
    res.json({
      success: true,
      token: tokenStr,
      user: {
        userId: u.user_id,
        email: u.email,
        displayName: u.display_name,
        role: u.role,
        institutionId: u.institution_id,
        urlSlug: u.url_slug,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/auth/me", requireAdmin, async (req: any, res) => {
  try {
    const result = await query(
      "SELECT user_id, email, display_name, role, institution_id, status FROM users WHERE user_id = $1",
      [req.vpsUser.userId]
    );
    if (!result.rowCount) return res.status(401).json({ error: "User tidak ditemukan" });
    const u = result.rows[0];
    res.json({
      user: {
        userId: u.user_id,
        email: u.email,
        displayName: u.display_name,
        role: u.role,
        institutionId: u.institution_id,
        status: u.status,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Register new user (super admin only)
router.post("/auth/register", requireSuperAdmin, async (req, res) => {
  try {
    const { email, password, displayName, role, institutionId } = req.body;
    if (!email || !password || !displayName) return res.status(400).json({ error: "Email, password, dan nama diperlukan." });
    const id = "USR-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    const hash = crypto.scryptSync(password, id.slice(0, 16), 64).toString("hex");
    await query(
      "INSERT INTO users (user_id, email, display_name, role, password_hash, institution_id) VALUES ($1,$2,$3,$4,$5,$6)",
      [id, email, displayName, role || "admin_rs", hash, institutionId || null]
    );
    res.json({ success: true, userId: id });
  } catch (err: any) {
    if (err.code === "23505") return res.status(409).json({ error: "Email sudah terdaftar." });
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  Module Templates per Tipe Institusi
// ============================================================
const MODULE_TEMPLATES: Record<string, { key: string; label: string }[]> = {
  hospital: [
    { key: "dashboard", label: "Dashboard" },
    { key: "patients", label: "Pendaftaran Pasien" },
    { key: "queue", label: "Sistem Antrian" },
    { key: "records", label: "Rekam Medis" },
    { key: "pharmacy", label: "Farmasi" },
    { key: "laboratory", label: "Laboratorium" },
    { key: "billing", label: "Billing & Kasir" },
    { key: "inpatient", label: "Rawat Inap" },
    { key: "reports", label: "Laporan & BI" },
    { key: "triage", label: "IGD Triage" },
    { key: "pacs", label: "PACS/Radiologi" },
    { key: "bpjs", label: "BPJS Bridging" },
    { key: "satusehat", label: "SatuSehat" },
    { key: "casemix", label: "Casemix/Coder" },
    { key: "surgery", label: "OK / Operasi" },
    { key: "icu", label: "ICU / NICU" },
    { key: "diet", label: "Gizi / Diet" },
    { key: "cssd", label: "CSSD" },
    { key: "bloodbank", label: "Bank Darah" },
    { key: "rehab", label: "Rehab Medik" },
    { key: "chemo", label: "Kemoterapi" },
    { key: "hd", label: "Hemodialisis" },
    { key: "mcu", label: "Medical Check Up" },
    { key: "employees", label: "Kepegawaian" },
    { key: "assets", label: "Manajemen Aset" },
    { key: "kars", label: "KARS / Mutu" },
    { key: "incidents", label: "Incident Report" },
    { key: "feedback", label: "Feedback Pasien" },
    { key: "discharge", label: "Discharge Summary" },
    { key: "referral", label: "Surat Rujukan" },
    { key: "consent", label: "Informed Consent" },
  ],
  puskesmas: [
    { key: "dashboard", label: "Dashboard" },
    { key: "patients", label: "Pendaftaran Pasien" },
    { key: "queue", label: "Sistem Antrian" },
    { key: "records", label: "Rekam Medis" },
    { key: "pharmacy", label: "Farmasi" },
    { key: "laboratory", label: "Laboratorium" },
    { key: "triage", label: "IGD Triage" },
    { key: "inpatient", label: "Rawat Inap" },
    { key: "reports", label: "Laporan & BI" },
    { key: "bpjs", label: "BPJS Bridging" },
    { key: "satusehat", label: "SatuSehat" },
    { key: "referral", label: "Surat Rujukan" },
    { key: "employees", label: "Kepegawaian" },
    { key: "assets", label: "Manajemen Aset" },
    { key: "incidents", label: "Incident Report" },
    { key: "feedback", label: "Feedback Pasien" },
  ],
  clinic: [
    { key: "dashboard", label: "Dashboard" },
    { key: "patients", label: "Pendaftaran Pasien" },
    { key: "queue", label: "Sistem Antrian" },
    { key: "records", label: "Rekam Medis" },
    { key: "pharmacy", label: "Farmasi" },
    { key: "billing", label: "Billing & Kasir" },
    { key: "triage", label: "Triage" },
    { key: "reports", label: "Laporan & BI" },
    { key: "bpjs", label: "BPJS Bridging" },
    { key: "employees", label: "Kepegawaian" },
    { key: "assets", label: "Manajemen Aset" },
    { key: "feedback", label: "Feedback Pasien" },
    { key: "referral", label: "Surat Rujukan" },
    { key: "consent", label: "Informed Consent" },
  ],
  apotek: [
    { key: "dashboard", label: "Dashboard" },
    { key: "patients", label: "Data Pasien" },
    { key: "pharmacy", label: "Farmasi" },
    { key: "inventory", label: "Stok Obat" },
    { key: "billing", label: "Billing & Kasir" },
    { key: "reports", label: "Laporan & BI" },
    { key: "satusehat", label: "SatuSehat" },
    { key: "employees", label: "Kepegawaian" },
    { key: "assets", label: "Manajemen Aset" },
  ],
  practice: [
    { key: "dashboard", label: "Dashboard" },
    { key: "patients", label: "Pendaftaran Pasien" },
    { key: "queue", label: "Sistem Antrian" },
    { key: "records", label: "Rekam Medis" },
    { key: "billing", label: "Billing & Kasir" },
    { key: "reports", label: "Laporan & BI" },
    { key: "bpjs", label: "BPJS Bridging" },
    { key: "referral", label: "Surat Rujukan" },
    { key: "consent", label: "Informed Consent" },
    { key: "feedback", label: "Feedback Pasien" },
  ],
};

const ALL_MODULE_KEYS = Object.values(MODULE_TEMPLATES).flat().filter((m, i, arr) => arr.findIndex(x => x.key === m.key) === i);

function generateSlug(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim() + "-" + crypto.randomUUID().slice(0, 4);
}

// Module templates
router.get("/module-templates", requireSuperAdmin, async (_req, res) => {
  res.json(MODULE_TEMPLATES);
});

// Institutions
router.get("/institutions", requireSuperAdmin, async (req, res) => {
  try {
    const result = await query(
      "SELECT id, name, type, address, city, province, phone, email, status, rs_online AS online, modules, url_slug, domain, last_sync, created_at FROM institutions ORDER BY name"
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/institutions/:id", requireSuperAdmin, async (req, res) => {
  try {
    const result = await query(
      "SELECT id, name, type, address, city, province, phone, email, contact_person, status, rs_online AS online, modules, url_slug, domain, last_sync, created_at FROM institutions WHERE id = $1",
      [req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Institusi tidak ditemukan." });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/institutions", requireSuperAdmin, async (req, res) => {
  try {
    const { name, type, address, city, province, phone, email, contactPerson, adminEmail, adminPassword } = req.body;
    const id = "INST-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    const slug = generateSlug(name || "institution");
    const defaultModules = MODULE_TEMPLATES[type] || MODULE_TEMPLATES.hospital;

    // 1) Create institution
    await query(
      `INSERT INTO institutions (id, name, type, address, city, province, phone, email, contact_person, modules, url_slug)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id, name, type || "hospital", address || "", city || "", province || "", phone || "", email || "", contactPerson || "",
       JSON.stringify(defaultModules.map(m => m.key)), slug]
    );

    // 2) Generate tunnel token & register in tunnel_registrations
    const tunnelToken = "tun-" + crypto.randomUUID().slice(0, 16).toUpperCase();
    await query(
      `INSERT INTO tunnel_registrations (rs_id, tunnel_token, created_at)
       VALUES ($1,$2,CURRENT_TIMESTAMP)
       ON CONFLICT (rs_id) DO UPDATE SET tunnel_token = $2, connected = false`,
      [id, tunnelToken]
    );

    // 3a) Auto-create rs_public_config with default sections
    const defaultConfig = {
      name, tagline: "",
      heroImage: "", branding: { logo: "", primaryColor: "#1e40af" },
      profile: { description: "", vision: "", mission: "" },
      gallery: [],
      polyclinics: [],
      organizationStructure: [],
      promotions: [],
      services: [],
      operationalHours: [],
    };
    await query(
      `INSERT INTO rs_public_config (institution_id, data, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (institution_id) DO NOTHING`,
      [id, JSON.stringify(defaultConfig)]
    );

    // 4) Auto-create admin_rs user (step moved from 3)
    const adminRsId = "USR-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    const rsEmail = adminEmail || `admin@${slug}.aone-trust.com`;
    const rsPassword = adminPassword || crypto.randomUUID().slice(0, 12) + "Aa1!";
    const hash = crypto.scryptSync(rsPassword, adminRsId.slice(0, 16), 64).toString("hex");
    await query(
      `INSERT INTO users (user_id, email, display_name, role, password_hash, institution_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [adminRsId, rsEmail, "Admin RS", "admin_rs", hash, id, "active"]
    );

    res.json({
      id, slug, success: true,
      adminEmail: rsEmail,
      adminPassword: rsPassword,
      tunnelToken,
      setup: {
        rsId: id,
        tunnelToken,
        adminEmail: rsEmail,
        adminPassword: rsPassword,
        urlSlug: slug,
        vpsUrl: process.env.VPS_URL || "ws://localhost:4000",
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/institutions/:id", requireSuperAdmin, async (req, res) => {
  try {
    const { name, type, status, address, city, province, phone, email } = req.body;
    // If type changed, set default modules for that type
    let modulesUpdate = "";
    const values: any[] = [name, type, status, address, city, province, phone, email, req.params.id];
    if (type && MODULE_TEMPLATES[type]) {
      modulesUpdate = ", modules = $" + (values.length + 1);
      values.push(JSON.stringify(MODULE_TEMPLATES[type].map(m => m.key)));
    }
    await query(
      `UPDATE institutions SET
        name = COALESCE($1, name), type = COALESCE($2, type), status = COALESCE($3, status),
        address = COALESCE($4, address), city = COALESCE($5, city),
        province = COALESCE($6, province), phone = COALESCE($7, phone), email = COALESCE($8, email)
        ${modulesUpdate}
       WHERE id = $9`,
      values
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Institution modules
router.get("/institutions/:id/modules", requireSuperAdmin, async (req, res) => {
  try {
    const result = await query("SELECT modules, type FROM institutions WHERE id = $1", [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: "Institusi tidak ditemukan." });
    const { modules, type } = result.rows[0];
    const allModules = MODULE_TEMPLATES[type] || MODULE_TEMPLATES.hospital;
    res.json({ enabled: modules || [], available: allModules, type });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/institutions/:id/modules", requireSuperAdmin, async (req, res) => {
  try {
    const { modules } = req.body;
    if (!Array.isArray(modules)) return res.status(400).json({ error: "Modules harus berupa array." });
    await query("UPDATE institutions SET modules = $1 WHERE id = $2",
      [JSON.stringify(modules), req.params.id]);
    res.json({ success: true, modules });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// RS Setup Config — digunakan oleh RS fisik untuk koneksi ke VPS
router.get("/institutions/:id/config", requireSuperAdmin, async (req, res) => {
  try {
    const [instResult, tunResult] = await Promise.all([
      query("SELECT id, name, type, url_slug, status FROM institutions WHERE id = $1", [req.params.id]),
      query("SELECT tunnel_token FROM tunnel_registrations WHERE rs_id = $1", [req.params.id]),
    ]);
    if (!instResult.rowCount) return res.status(404).json({ error: "Institusi tidak ditemukan." });
    const inst = instResult.rows[0];
    const tun = tunResult.rows[0];
    res.json({
      rsId: inst.id,
      name: inst.name,
      type: inst.type,
      urlSlug: inst.url_slug,
      tunnelToken: tun?.tunnel_token || "NOT_CONFIGURED",
      vpsUrl: process.env.VPS_URL || "ws://localhost:4000",
      status: inst.status,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Regenerate tunnel token
router.post("/institutions/:id/regenerate-token", requireSuperAdmin, async (req, res) => {
  try {
    const tunToken = "tun-" + crypto.randomUUID().slice(0, 16).toUpperCase();
    await query(
      `INSERT INTO tunnel_registrations (rs_id, tunnel_token, created_at)
       VALUES ($1,$2,CURRENT_TIMESTAMP)
       ON CONFLICT (rs_id) DO UPDATE SET tunnel_token = $2, connected = false`,
      [req.params.id, tunToken]
    );
    res.json({ success: true, tunnelToken: tunToken });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Institution subdomain / URL slug
router.patch("/institutions/:id/slug", requireSuperAdmin, async (req, res) => {
  try {
    const { url_slug } = req.body;
    if (!url_slug || !/^[a-z0-9-]+$/.test(url_slug)) {
      return res.status(400).json({ error: "Slug hanya boleh huruf kecil, angka, dan tanda hubung." });
    }
    await query("UPDATE institutions SET url_slug = $1 WHERE id = $2", [url_slug, req.params.id]);
    res.json({ success: true, url_slug });
  } catch (err: any) {
    if (err.code === "23505") return res.status(409).json({ error: "Slug sudah digunakan institusi lain." });
    res.status(500).json({ error: err.message });
  }
});

// Institution domain (custom domain for public access)
router.patch("/institutions/:id/domain", requireSuperAdmin, async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(domain)) {
      return res.status(400).json({ error: "Format domain tidak valid." });
    }
    await query("UPDATE institutions SET domain = $1 WHERE id = $2", [domain, req.params.id]);
    res.json({ success: true, domain });
  } catch (err: any) {
    if (err.code === "23505") return res.status(409).json({ error: "Domain sudah digunakan institusi lain." });
    res.status(500).json({ error: err.message });
  }
});

// Users
router.get("/users", requireSuperAdmin, async (req, res) => {
  try {
    const { institutionId, role } = req.query;
    let sql = "SELECT user_id, email, display_name, role, institution_id, status, created_at FROM users WHERE 1=1";
    const params: any[] = [];
    if (institutionId) { sql += " AND institution_id = $" + (params.length + 1); params.push(institutionId); }
    if (role) { sql += " AND role = $" + (params.length + 1); params.push(role); }
    sql += " ORDER BY created_at DESC";
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/users/:id", requireSuperAdmin, async (req, res) => {
  try {
    const { role, status } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    if (role) { updates.push("role = $" + (values.length + 1)); values.push(role); }
    if (status) { updates.push("status = $" + (values.length + 1)); values.push(status); }
    if (!updates.length) return res.json({ message: "Tidak ada perubahan." });
    values.push(req.params.id);
    await query(`UPDATE users SET ${updates.join(", ")} WHERE user_id = $${values.length}`, values);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Licenses
router.get("/licenses", requireSuperAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT l.id, l.institution_id, i.name AS institution_name, l.plan, l.status,
              l.max_users, l.start_date, l.end_date, l.auto_renew, l.modules,
              l.created_at
       FROM licenses l LEFT JOIN institutions i ON l.institution_id = i.id
       ORDER BY l.created_at DESC`
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/licenses", requireSuperAdmin, async (req, res) => {
  try {
    const { institutionId, plan, status, maxUsers, startDate, endDate, autoRenew, modules } = req.body;
    const id = "LIC-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    await query(
      `INSERT INTO licenses (id, institution_id, plan, status, max_users, start_date, end_date, auto_renew, modules)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, institutionId, plan || "free", status || "trial", maxUsers || 5,
       startDate || new Date(), endDate || null, autoRenew || false, modules || []]
    );
    res.json({ id, success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Online RS via tunnel
router.get("/online-rs", requireSuperAdmin, (_req, res) => {
  res.json(getOnlineRs());
});

// Dashboard summary
router.get("/dashboard", requireSuperAdmin, async (req, res) => {
  try {
    const [instCount, userCount, activeLic, onlineCount] = await Promise.all([
      query("SELECT COUNT(*) FROM institutions"),
      query("SELECT COUNT(*) FROM users"),
      query("SELECT COUNT(*) FROM licenses WHERE status = 'active'"),
      query("SELECT COUNT(*) FROM institutions WHERE rs_online = true"),
    ]);
    res.json({
      totalInstitutions: parseInt(instCount.rows[0].count),
      totalUsers: parseInt(userCount.rows[0].count),
      activeLicenses: parseInt(activeLic.rows[0].count),
      onlineRs: parseInt(onlineCount.rows[0].count),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  LICENSE MANAGEMENT
// ============================================================

// Generate license key for an institution
router.post("/license/generate", requireSuperAdmin, async (req, res) => {
  try {
    const { institutionId, plan, validDays, modules } = req.body;
    if (!institutionId) return res.status(400).json({ error: "institutionId diperlukan." });

    const instResult = await query(
      "SELECT id, name, type, modules FROM institutions WHERE id = $1",
      [institutionId]
    );
    if (!instResult.rowCount) return res.status(404).json({ error: "Institusi tidak ditemukan." });
    const inst = instResult.rows[0];

    // Generate unique license key: LIC-INSTID-TIMESTAMP-RANDOM
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
    const licenseKey = `LIC-${institutionId.slice(5, 13)}-${timestamp}-${randomPart}`;

    const validUntil = validDays
      ? new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const enabledModules = modules || inst.modules || [];
    const modulesArr = Array.isArray(enabledModules) ? enabledModules : (typeof enabledModules === 'string' ? JSON.parse(enabledModules) : []);
    const licenseHash = crypto
      .createHmac("sha256", process.env.LICENSE_SECRET || "aone-trust-secret-key")
      .update(licenseKey + institutionId)
      .digest("hex");

    await query(
      `INSERT INTO licenses (id, institution_id, plan, status, max_users, start_date, end_date, auto_renew, modules)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO NOTHING`,
      [
        licenseKey,
        institutionId,
        plan || "professional",
        "active",
        999,
        new Date(),
        validUntil ? new Date(validUntil) : null,
        true,
        modulesArr,
      ]
    );

    res.json({
      success: true,
      licenseKey,
      institutionId,
      institutionName: inst.name,
      institutionType: inst.type,
      plan: plan || "professional",
      validUntil,
      modules: enabledModules,
      hash: licenseHash,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Verify a license key (called by local RS server)
router.post("/license/verify", async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const entry = verifyLimiter.get(ip);
  if (entry && entry.resetAt > now) {
    if (entry.count >= 10) return res.status(429).json({ valid: false, error: "Terlalu banyak percobaan. Coba lagi nanti." });
    entry.count++;
  } else {
    verifyLimiter.set(ip, { count: 1, resetAt: now + 60000 });
  }
  try {
    const { licenseKey } = req.body;
    if (!licenseKey) {
      return res.status(400).json({ valid: false, error: "licenseKey diperlukan." });
    }

    const result = await query(
      `SELECT l.id, l.institution_id, i.name AS institution_name, i.type AS institution_type,
              l.plan, l.status, l.end_date, l.modules
       FROM licenses l LEFT JOIN institutions i ON l.institution_id = i.id
       WHERE l.id = $1`,
      [licenseKey]
    );

    if (!result.rowCount) {
      return res.json({ valid: false, error: "Kode lisensi tidak ditemukan." });
    }

    const lic = result.rows[0];

    if (lic.status !== "active") {
      return res.json({ valid: false, error: `Lisensi berstatus: ${lic.status}.` });
    }

    if (lic.end_date && new Date(lic.end_date) < new Date()) {
      return res.json({ valid: false, error: "Lisensi sudah kadaluarsa.", expiredAt: lic.end_date });
    }

    const modules = typeof lic.modules === "string" ? JSON.parse(lic.modules) : lic.modules || [];

    res.json({
      valid: true,
      institutionName: lic.institution_name,
      institutionType: lic.institution_type,
      plan: lic.plan,
      validUntil: lic.end_date,
      modules,
    });
  } catch (err: any) {
    res.status(500).json({ valid: false, error: err.message });
  }
});

// Get all licenses for an institution
router.get("/institutions/:id/licenses", requireSuperAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT id AS license_key, plan, status, start_date, end_date, modules, auto_renew
       FROM licenses WHERE institution_id = $1 ORDER BY start_date DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  Admin RS — manage own website config
// ============================================================

// Get institution by slug or id (admin_rs scoped to own, super_admin can specify any)
router.get("/my/institution", requireAdmin, async (req: any, res) => {
  try {
    const slug = req.query.slug as string;
    const id = req.query.id as string;
    let instId = id;
    if (slug) {
      const r = await query("SELECT id FROM institutions WHERE url_slug = $1", [slug]);
      if (!r.rowCount) return res.status(404).json({ error: "Institusi tidak ditemukan." });
      instId = r.rows[0].id;
    }
    if (req.userRole !== "super_admin") {
      if (instId && instId !== req.userInstId) return res.status(403).json({ error: "Akses ditolak." });
      instId = req.userInstId;
    }
    if (!instId) return res.status(400).json({ error: "Institution ID required" });
    const result = await query(
      "SELECT id, name, type, address, city, province, phone, email, status, modules, url_slug, domain FROM institutions WHERE id = $1",
      [instId]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Institusi tidak ditemukan." });
    const inst = result.rows[0];
    const configResult = await query("SELECT data FROM rs_public_config WHERE institution_id = $1", [instId]);
    res.json({ ...inst, publicConfig: configResult.rows[0]?.data || {} });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Update public website config (profile, gallery, polyclinics, etc.)
router.patch("/my/institution/config", requireAdmin, async (req: any, res) => {
  try {
    const slug = req.query.slug as string;
    const id = req.query.id as string;
    let instId = id;
    if (slug) {
      const r = await query("SELECT id FROM institutions WHERE url_slug = $1", [slug]);
      if (!r.rowCount) return res.status(404).json({ error: "Institusi tidak ditemukan." });
      instId = r.rows[0].id;
    }
    if (req.userRole !== "super_admin") {
      if (instId && instId !== req.userInstId) return res.status(403).json({ error: "Akses ditolak." });
      instId = req.userInstId;
    }
    if (!instId) return res.status(400).json({ error: "Institution ID required" });
    const { config } = req.body;
    if (!config) return res.status(400).json({ error: "config required" });
    const existing = await query("SELECT data FROM rs_public_config WHERE institution_id = $1", [instId]);
    const merged = existing.rowCount ? { ...existing.rows[0].data, ...config } : config;
    await query(
      `INSERT INTO rs_public_config (institution_id, data, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (institution_id) DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP`,
      [instId, JSON.stringify(merged)]
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Upload image (admin only)
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
const _ud = path.dirname(fileURLToPath(import.meta.url));
const upload = multer({
  dest: path.join(_ud, "../../uploads"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Only images allowed"));
    cb(null, true);
  },
});
router.post("/upload", requireAdmin, upload.single("file"), (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const ext = path.extname(req.file.originalname) || ".jpg";
  const newName = crypto.randomUUID() + ext;
  const fs = require("fs");
  fs.renameSync(req.file.path, path.join(req.file.destination, newName));
  res.json({ url: `/uploads/${newName}` });
});

// Landing page config — public GET, super admin PUT
router.get("/landing-config", async (_req, res) => {
  try {
    const result = await query("SELECT data FROM vendor_landing_config WHERE id = 1");
    res.json(result.rows[0]?.data || {});
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/landing-config", requireSuperAdmin, async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: "Data diperlukan" });
    await query("UPDATE vendor_landing_config SET data = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = 1", [JSON.stringify(data)]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
