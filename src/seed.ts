import "dotenv/config";
import { query, migrate } from "./db.js";
import crypto from "crypto";

async function seed() {
  console.log("[SEED] Migrating schema...");
  await migrate();

  const existing = await query("SELECT COUNT(*) FROM institutions");
  if (parseInt(existing.rows[0].count) > 0) {
    console.log("[SEED] Data sudah ada, skip seed.");
    process.exit(0);
  }

  const instId = "INST-DEMO-01";
  const defaultModules = ["dashboard","patients","queue","records","pharmacy","laboratory","billing","inpatient","reports","triage","pacs","bpjs","satusehat","casemix","surgery","icu","diet","cssd","bloodbank","rehab","chemo","hd","mcu","employees","assets","kars","incidents","feedback","discharge","referral","consent"];
  await query(
    `INSERT INTO institutions (id, name, type, address, city, province, phone, email, status, modules, url_slug)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [instId, "RSUD Demo Hospital", "hospital", "Jl. Kesehatan No.1", "Jakarta", "DKI Jakarta",
     "021-1234567", "info@rsuddemo.com", "active", defaultModules, "rsud-demo"]
  );

  const users = [
    { id: "SA-" + crypto.randomUUID().slice(0, 8).toUpperCase(), email: "superadmin@aone-trust.com", name: "Super Admin", role: "super_admin", inst: null },
    { id: "ADM-" + crypto.randomUUID().slice(0, 8).toUpperCase(), email: "admin@rsuddemo.com", name: "Admin RS", role: "admin_rs", inst: instId },
    { id: "DOK-" + crypto.randomUUID().slice(0, 8).toUpperCase(), email: "dokter@rsuddemo.com", name: "Dr. Andi", role: "dokter", inst: instId },
  ];

  for (const u of users) {
    const exists = await query("SELECT 1 FROM users WHERE email = $1", [u.email]);
    if (exists.rowCount) { console.log(`[SKIP] User ${u.email} already exists`); continue; }
    const hash = crypto.scryptSync("Admin123!", u.id.slice(0, 16), 64).toString("hex");
    await query(
      "INSERT INTO users (user_id, email, display_name, role, password_hash, institution_id) VALUES ($1,$2,$3,$4,$5,$6)",
      [u.id, u.email, u.name, u.role, hash, u.inst]
    );
    console.log(`[CREATE] ${u.role}: ${u.email} / Admin123!`);
  }

  await query(
    `INSERT INTO licenses (id, institution_id, plan, status, max_users, start_date, modules)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (id) DO NOTHING`,
    ["LIC-DEMO-01", instId, "enterprise", "active", 999, new Date(),
     "{dashboard,patients,queue,records,pharmacy,laboratory,billing,inpatient,reports,triage,pacs,bpjs,satusehat,casemix,surgery,icu,diet,cssd,bloodbank,rehab,chemo,hd,mcu,employees,assets,kars,incidents,feedback,discharge,referral,consent}"]
  );

  console.log("[SEED] Data demo berhasil dibuat!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[SEED] Error:", err);
  process.exit(1);
});
