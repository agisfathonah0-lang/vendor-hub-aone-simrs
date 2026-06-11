import pg from "pg";
import { readFileSync, existsSync } from "fs";

const pool = new pg.Pool({
  host: process.env.PGHOST || "localhost",
  port: parseInt(process.env.PGPORT || "5432"),
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "postgres",
  database: process.env.PGDATABASE || "simrs_hub",
  max: 20,
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  console.error("[DB_POOL] Unexpected error:", err);
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 1000) {
    console.warn(`[DB_SLOW] ${duration}ms — ${text.slice(0, 80)}`);
  }
  return res;
}

export async function migrate() {
  const sql = `
  CREATE TABLE IF NOT EXISTS institutions (
    id VARCHAR(128) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'hospital',
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    contact_person VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    rs_online BOOLEAN DEFAULT false,
    modules JSONB DEFAULT '[]'::jsonb,
    url_slug VARCHAR(255) UNIQUE,
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(128) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255),
    institution_id VARCHAR(128) REFERENCES institutions(id),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS licenses (
    id VARCHAR(128) PRIMARY KEY,
    institution_id VARCHAR(128) REFERENCES institutions(id),
    plan VARCHAR(50) NOT NULL DEFAULT 'free',
    status VARCHAR(50) NOT NULL DEFAULT 'trial',
    max_users INTEGER DEFAULT 5,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT false,
    modules TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS public_queues (
    id VARCHAR(128) PRIMARY KEY,
    institution_id VARCHAR(128) REFERENCES institutions(id),
    patient_name VARCHAR(255) NOT NULL,
    patient_nik VARCHAR(16),
    patient_phone VARCHAR(20),
    department VARCHAR(100) NOT NULL,
    doctor_id VARCHAR(128),
    doctor_name VARCHAR(255),
    queue_number VARCHAR(20),
    status VARCHAR(50) DEFAULT 'waiting',
    source VARCHAR(50) DEFAULT 'online',
    booking_date DATE,
    booking_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tunnel_registrations (
    rs_id VARCHAR(128) PRIMARY KEY REFERENCES institutions(id),
    tunnel_token VARCHAR(255) NOT NULL,
    connected BOOLEAN DEFAULT false,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    local_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sync_log (
    id SERIAL PRIMARY KEY,
    institution_id VARCHAR(128) REFERENCES institutions(id),
    table_name VARCHAR(100),
    action VARCHAR(20),
    record_id VARCHAR(128),
    status VARCHAR(20) DEFAULT 'pending',
    payload JSONB,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(128),
    action VARCHAR(100),
    details JSONB,
    ip VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Mobile app tables
  CREATE TABLE IF NOT EXISTS mobile_devices (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) REFERENCES users(user_id),
    device_type VARCHAR(20) NOT NULL, -- dokter, pasien
    platform VARCHAR(20), -- android, ios
    fcm_token VARCHAR(512),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) REFERENCES users(user_id),
    title VARCHAR(255),
    body TEXT,
    data JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Migrations for existing tables
  ALTER TABLE institutions ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '[]'::jsonb;
  ALTER TABLE institutions ADD COLUMN IF NOT EXISTS url_slug VARCHAR(255);
  ALTER TABLE institutions ADD COLUMN IF NOT EXISTS domain VARCHAR(255);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_institutions_domain ON institutions(domain) WHERE domain IS NOT NULL;
  -- Convert licenses.modules from TEXT[] to JSONB (safe re-run)
  DO $$ BEGIN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name='licenses' AND column_name='modules') = 'ARRAY' THEN
      ALTER TABLE licenses ALTER COLUMN modules DROP DEFAULT;
      ALTER TABLE licenses ALTER COLUMN modules TYPE JSONB USING to_jsonb(modules);
      ALTER TABLE licenses ALTER COLUMN modules SET DEFAULT '[]'::jsonb;
    END IF;
  END $$;

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution_id);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_licenses_institution ON licenses(institution_id);
  CREATE INDEX IF NOT EXISTS idx_public_queues_institution ON public_queues(institution_id);
  CREATE INDEX IF NOT EXISTS idx_public_queues_status ON public_queues(status);
  CREATE INDEX IF NOT EXISTS idx_sync_log_institution ON sync_log(institution_id);
  CREATE INDEX IF NOT EXISTS idx_sync_log_status ON sync_log(status);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  `;
  await query(sql);
  console.log("[DB] Hub schema migrated successfully");
}
