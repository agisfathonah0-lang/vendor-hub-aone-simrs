/**
 * AONE TRUST SIMRS — VPS Hub Server v3
 *
 * Vendor Hub pusat untuk:
 *  - Super Admin manage semua RS
 *  - Public API (antrian online, jadwal dokter)
 *  - Tunnel WebSocket relay ke RS lokal
 *  - BPJS & SatuSehat bridging (opsional)
 *  - Mobile API (dokter & pasien apps)
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import http from "http";
import https from "https";
import { readFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { query, migrate } from "./src/db.js";
import { initTunnelServer } from "./src/tunnel/manager.js";
import vendorRoutes, { verifyToken } from "./src/routes/vendor.js";
import publicRoutes from "./src/routes/public.js";
import syncRoutes from "./src/routes/sync.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || "4000");
const DEV_ORIGIN = process.env.DEV_ORIGIN || "http://localhost:5173";
const PROD_ORIGIN = process.env.PROD_ORIGIN || "https://hub.aone-trust.com";
const CORS_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(s => s.trim())
  : [DEV_ORIGIN, PROD_ORIGIN];

const isDist = path.basename(__dirname) === 'dist';
const FRONTEND_DIR = isDist
  ? path.join(__dirname, "..", "frontend", "dist")
  : path.join(__dirname, "frontend", "dist");

const app = express();

// Trust proxy (Render, Cloudflare, etc.)
app.set('trust proxy', 1);

// Security & parsing
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || CORS_ORIGINS.includes("*") || CORS_ORIGINS.includes(origin)) return cb(null, true);
    cb(null, false);
  },
}));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Rate limiting
const limiter = rateLimit({ windowMs: 60000, max: 100, standardHeaders: true, legacyHeaders: false, message: { error: "Terlalu banyak permintaan, coba lagi nanti." } });
app.use("/api", limiter);
const loginLimiter = rateLimit({ windowMs: 60000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: "Terlalu banyak percobaan login. Coba lagi dalam 1 menit." } });
app.use("/api/vendor/auth/login", loginLimiter);

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================
//  Domain-based Virtual Hosting
// ============================================================

// Cache: domain → { rsId, name }
const domainCache = new Map<string, { rsId: string; name: string }>();
let lastDomainFetch = 0;
const DOMAIN_CACHE_TTL = 60000;

async function refreshDomainCache() {
  try {
    const result = await query(
      "SELECT domain, id, name FROM institutions WHERE domain IS NOT NULL AND status = 'active'"
    );
    domainCache.clear();
    for (const row of result.rows) {
      if (row.domain) domainCache.set(row.domain.toLowerCase(), { rsId: row.id, name: row.name });
    }
    lastDomainFetch = Date.now();
    console.log(`[DOMAIN] Cache: ${domainCache.size} active domains`);
  } catch (err) {
    console.error('[DOMAIN] Cache refresh error:', err);
  }
}

// Domain proxy middleware — intercept requests to institution domains
app.use(async (req, res, next) => {
  if (req.path.startsWith('/tunnel')) return next();

  const host = req.headers.host?.toLowerCase();
  if (!host) return next();

  const hostname = host.split(':')[0];
  const vpsDomain = (process.env.VPS_DOMAIN || '').toLowerCase();

  // Skip VPS Hub's own domain and loopback
  if (!vpsDomain || hostname === vpsDomain || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
    return next();
  }

  // Refresh cache if stale
  if (Date.now() - lastDomainFetch > DOMAIN_CACHE_TTL) {
    await refreshDomainCache();
  }

  const entry = domainCache.get(hostname);
  if (!entry) return next();

  // Proxy to RS server via tunnel
  try {
    const { proxyToRs } = await import("./src/tunnel/manager.js");
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method);
    const result = await proxyToRs(entry.rsId, req.method, req.path, {
      'content-type': req.headers['content-type'] || 'application/json',
      'cookie': req.headers['cookie'] || '',
      'authorization': req.headers['authorization'] || '',
    }, hasBody ? req.body : undefined);

    const ct = (result.headers?.['content-type'] || 'application/json') as string;
    res.set('Content-Type', ct);
    if (ct.includes('application/json') && typeof result.body === 'object') {
      res.status(result.status).json(result.body);
    } else {
      const bodyStr = typeof result.body === 'object' ? JSON.stringify(result.body) : result.body;
      res.status(result.status).send(bodyStr);
    }
  } catch (err: any) {
    const wantsHtml = (req.headers.accept || '').includes('text/html');
    if (wantsHtml) {
      res.status(502).send(`<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh"><div style="text-align:center"><h1>🔴 RS Sedang Offline</h1><p>${entry.name.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c] || c)} tidak terhubung. Coba lagi nanti.</p></div></body></html>`);
    } else {
      res.status(502).json({ error: `RS offline: ${err.message}` });
    }
  }
});

// ============================================================
//  Routes
// ============================================================

// Health check
app.get("/api/status", (_req, res) => {
  res.json({
    status: "ok",
    service: "AONE TRUST SIMRS Hub",
    version: "3.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Vendor Hub (Super Admin)
app.use("/api/vendor", vendorRoutes);

// Public & Mobile API
app.use("/api/public", publicRoutes);

// Sync API (dari RS lokal)
app.use("/api/sync", syncRoutes);

// Proxy: forward request ke RS tertentu via tunnel (super_admin only)
app.all("/api/proxy/:rsId/*", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ") || !verifyToken(authHeader.slice(7))) {
    return res.status(401).json({ error: "Unauthorized — super admin token required" });
  }
  const rsId = req.params.rsId;
  const targetPath = "/" + req.params[0];
  try {
    const { proxyToRs } = await import("./src/tunnel/manager.js");
    const hasBody = ["POST", "PUT", "PATCH"].includes(req.method);
    const result = await proxyToRs(rsId, req.method, targetPath, {
      "content-type": req.headers["content-type"] || "application/json",
      authorization: req.headers.authorization || "",
    }, hasBody ? req.body : undefined);
    const ct = (result.headers?.['content-type'] || 'application/json') as string;
    res.set('Content-Type', ct);
    if (ct.includes('application/json') && typeof result.body === 'object') {
      res.status(result.status).json(result.body);
    } else {
      res.status(result.status).send(result.body);
    }
  } catch (err: any) {
    res.status(502).json({ error: `RS ${rsId} unreachable: ${err.message}` });
  }
});

// 404 for unmatched API routes (don't fall through to SPA)
app.use("/api", (_req, res) => res.status(404).json({ error: "API endpoint tidak ditemukan" }));

// Serve uploads & frontend SPA build
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOAD_DIR));
app.use(express.static(FRONTEND_DIR));
app.get("*", (_req, res) => {
  const indexHtml = path.join(FRONTEND_DIR, "index.html");
  if (existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(200).json({
      status: "ok",
      service: "AONE TRUST SIMRS Hub",
      version: "3.0.0",
      uptime: process.uptime(),
      note: "Frontend not built yet — run: cd frontend && npm install && npm run build",
    });
  }
});

// ============================================================
//  Start Server
// ============================================================

async function start() {
  // Ensure data directories
  ["logs", "backups"].forEach((d) => {
    const dir = path.join(__dirname, d);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  });

  // Database migration
  await migrate();

  // Seed default admin if empty
  const adminCount = await query("SELECT COUNT(*) FROM users WHERE role = 'super_admin'");
  if (parseInt(adminCount.rows[0].count) === 0) {
    const crypto = (await import("crypto")).default;
    const id = "SA-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    const email = process.env.ADMIN_EMAIL || "superadmin@aone-trust.com";
    const password = process.env.ADMIN_PASSWORD;
    if (!password) throw new Error("ADMIN_PASSWORD environment variable is required!");
    const hash = crypto.scryptSync(password, id.slice(0, 16), 64).toString("hex");
    await query(
      "INSERT INTO users (user_id, email, display_name, role, password_hash) VALUES ($1,$2,$3,$4,$5)",
      [id, email, "Super Admin", "super_admin", hash]
    );
    console.log(`[SEED] Super Admin created — ${email} / ${password}`);
  }

  // Warm domain cache
  await refreshDomainCache();

  // Global error handler
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error(`[ERROR] ${err.message || err}`);
    res.status(err.status || 500).json({ error: "Terjadi kesalahan internal server." });
  });

  // HTTP or HTTPS
  let server: http.Server | https.Server;
  const useSSL = process.env.HTTPS === "true";
  if (useSSL) {
    const CERT_DIR = path.join(__dirname, "certs");
    const keyPath = path.join(CERT_DIR, "server.key");
    const certPath = path.join(CERT_DIR, "server.cert");
    if (existsSync(keyPath) && existsSync(certPath)) {
      server = https.createServer({
        key: readFileSync(keyPath),
        cert: readFileSync(certPath),
      }, app);
      console.log("[SSL] HTTPS enabled");
    } else {
      console.warn("[SSL] Certificate not found, falling back to HTTP");
      server = http.createServer(app);
    }
  } else {
    server = http.createServer(app);
  }

  // Init tunnel WebSocket server
  initTunnelServer(server);

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`===========================================================`);
    console.log(`  AONE TRUST SIMRS Hub v3`);
    console.log(`  Port       : ${PORT}`);
    console.log(`  Mode       : ${useSSL ? "HTTPS" : "HTTP"}`);
    console.log(`  Vendor Hub : http://localhost:${PORT}/api/vendor`);
    console.log(`  Public API : http://localhost:${PORT}/api/public`);
    console.log(`  Tunnel     : ws://localhost:${PORT}/tunnel`);
    console.log(`===========================================================`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
