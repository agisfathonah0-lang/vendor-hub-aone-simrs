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
      "021-1234567", "info@rsuddemo.com", "active", JSON.stringify(defaultModules), "rsud-demo"]
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
      JSON.stringify(defaultModules)]
  );

  const demoConfig = {
    heroImage: "",
    name: "RSUD Demo Hospital",
    tagline: "Melayani dengan Hati, Menuju Sehat Bersama",
    branding: { logo: "", primaryColor: "#1e40af" },
    profile: {
      description: "RSUD Demo Hospital adalah rumah sakit umum daerah yang berkomitmen memberikan pelayanan kesehatan berkualitas tinggi dengan teknologi modern dan tenaga medis profesional. Berdiri sejak 2010, kami telah melayani lebih dari 100.000 pasien setiap tahunnya.",
      vision: "Menjadi rumah sakit terpercaya dan unggul di bidang pelayanan kesehatan, pendidikan, dan penelitian secara nasional pada tahun 2030.",
      mission: "Memberikan pelayanan kesehatan yang aman, bermutu, dan terjangkau.\nMengembangkan sumber daya manusia yang kompeten dan berintegritas.\nMenerapkan tata kelola rumah sakit yang baik dan transparan.\nMeningkatkan inovasi dan teknologi dalam pelayanan kesehatan.",
    },
    services: [
      { name: "IGD 24 Jam", description: "Pelayanan gawat darurat nonstop" },
      { name: "Rawat Inap", description: "Fasilitas rawat inap nyaman" },
      { name: "Laboratorium", description: "Pemeriksaan lab lengkap" },
      { name: "Radiologi", description: "Rontgen, CT Scan, MRI" },
      { name: "Farmasi", description: "Apotek 24 jam" },
      { name: "MCU", description: "Medical check up" },
    ],
    operationalHours: [
      { day: "Senin - Jumat", buka: "08:00", tutup: "20:00" },
      { day: "Sabtu", buka: "08:00", tutup: "16:00" },
      { day: "Minggu & Libur", buka: "IGD 24 Jam", tutup: "IGD 24 Jam" },
    ],
    polyclinics: [
      { name: "Poli Umum", description: "Pelayanan kesehatan dasar", specialists: ["dr. Andi Pratama, Sp.PD", "dr. Siti Rahma, Sp.PD", "dr. Budi Santoso"] },
      { name: "Poli Anak", description: "Kesehatan anak dan tumbuh kembang", specialists: ["dr. Maya Dewi, Sp.A", "dr. Rina Fitriani, Sp.A"] },
      { name: "Poli Kebidanan", description: "Kesehatan ibu hamil dan kandungan", specialists: ["dr. Fitriani, Sp.OG", "dr. Nuri Indah, Sp.OG"] },
      { name: "Poli Gigi", description: "Kesehatan gigi dan mulut", specialists: ["drg. Ahmad Fauzi, Sp.BM"] },
      { name: "Poli Mata", description: "Kesehatan mata dan koreksi penglihatan", specialists: ["dr. Indra Wijaya, Sp.M"] },
      { name: "Poli Jantung", description: "Diagnosis dan terapi penyakit jantung", specialists: ["dr. Hasan Makarim, Sp.JP", "dr. Dewi Sartika, Sp.JP"] },
      { name: "Poli Saraf", description: "Gangguan sistem saraf", specialists: ["dr. Agus Wibowo, Sp.S"] },
      { name: "Poli Kulit", description: "Kesehatan kulit dan kelamin", specialists: ["dr. Kartika Sari, Sp.KK"] },
    ],
    organizationStructure: [
      {
        position: "Direktur Utama", name: "dr. H. Ahmad Syahputra, MARS",
        children: [
          {
            position: "Wakil Direktur Umum & Keuangan", name: "Drs. Bambang Wijaya, MM",
            children: [
              { position: "Kepala Bagian Keuangan", name: "Sri Wahyuni, SE" },
              { position: "Kepala Bagian SDM", name: "Dian Permata, S.Kom" },
              { position: "Kepala Bagian Logistik", name: "Eko Prasetyo, ST" },
            ],
          },
          {
            position: "Wakil Direktur Medik & Keperawatan", name: "dr. Fitriani Nur, Sp.A, M.Kes",
            children: [
              { position: "Kepala Bidang Medik", name: "dr. Rudi Hartono, Sp.PD" },
              { position: "Kepala Bidang Keperawatan", name: "Ns. Maria Ulfah, S.Kep" },
              { position: "Kepala Bidang Penunjang", name: "dr. Indah Lestari, Sp.Rad" },
            ],
          },
        ],
      },
    ],
    gallery: [
      { image: "", caption: "Peresmian Gedung Baru IGD", type: "Kegiatan" },
      { image: "", caption: "Penghargaan RS Terbaik 2026", type: "Prestasi" },
      { image: "", caption: "Bakti Sosial Kesehatan Desa", type: "Kegiatan" },
    ],
    promotions: [
      { type: "Promo", title: "MCU Paket Hemat", description: "Medical check up lengkap hanya Rp 500.000. Berlaku hingga akhir bulan ini.", image: "" },
      { type: "Berita", title: "Vaksinasi COVID-19", description: "Pendaftaran vaksinasi COVID-19 dosis 1, 2, dan booster dibuka setiap hari.", image: "" },
      { type: "Pengumuman", title: "Dokter Spesialis Baru", description: "dr. Hasan Makarim, Sp.JP kini praktik di Poli Jantung setiap Senin & Kamis.", image: "" },
    ],
  };

  await query(
    `INSERT INTO rs_public_config (institution_id, data, updated_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (institution_id) DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP`,
    [instId, JSON.stringify(demoConfig)]
  );

  console.log("[SEED] Public config + gallery + poli + struktur organisasi berhasil diisi!");
  console.log("[SEED] Data demo berhasil dibuat!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[SEED] Error:", err);
  process.exit(1);
});
