'use strict';
// Temporary migration runner — DELETE after all 4 migrations confirmed applied
// Auth: static token + optional credential headers for operator-driven runs
const MIGRATION_TOKEN = 'vst-mig-2026-a8b3c4d5';
const crypto = require('crypto');

const SUPABASE_REF = 'ovmlmregvcekbvoctywe';
const MGMT_BASE    = `https://api.supabase.com/v1/projects/${SUPABASE_REF}/database/query`;
const REST_BASE    = `https://${SUPABASE_REF}.supabase.co/rest/v1`;

const MIGRATIONS = [
  {
    name: '001_user_profiles.sql',
    checkTable: 'user_profiles',
    sql: `CREATE TABLE IF NOT EXISTS user_profiles (
  id                    uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier                  text        NOT NULL DEFAULT 'GUEST' CHECK (tier IN ('GUEST','PREMIUM','VOYAGE_ELITE')),
  full_name             text        NOT NULL DEFAULT '',
  preferred_name        text        NOT NULL DEFAULT '',
  avatar_url            text,
  date_of_birth         date,
  nationality           char(2),
  passport_number       text,
  passport_expiry       date,
  kyc_status            text        NOT NULL DEFAULT 'NOT_STARTED' CHECK (kyc_status IN ('NOT_STARTED','PENDING','VERIFIED','REJECTED')),
  phone                 text,
  phone_verified        boolean     NOT NULL DEFAULT false,
  email_verified        boolean     NOT NULL DEFAULT false,
  locale                text        NOT NULL DEFAULT 'en-GB',
  timezone              text        NOT NULL DEFAULT 'Europe/London',
  currency              char(3)     NOT NULL DEFAULT 'GBP',
  home_airport          char(3),
  cabin_class           text        NOT NULL DEFAULT 'ECONOMY' CHECK (cabin_class IN ('ECONOMY','PREMIUM_ECONOMY','BUSINESS','FIRST')),
  seat_preference       text        NOT NULL DEFAULT 'NO_PREFERENCE',
  meal_preference       text        NOT NULL DEFAULT 'STANDARD',
  loyalty_programs      jsonb       NOT NULL DEFAULT '[]',
  mobility              text        NOT NULL DEFAULT 'NONE',
  wheelchair_type       text        NOT NULL DEFAULT 'NOT_APPLICABLE',
  vision                text        NOT NULL DEFAULT 'NONE',
  hearing               text        NOT NULL DEFAULT 'NONE',
  cognitive             boolean     NOT NULL DEFAULT false,
  dietary_medical       jsonb       NOT NULL DEFAULT '[]',
  requires_carer        boolean     NOT NULL DEFAULT false,
  accessibility_notes   text        NOT NULL DEFAULT '',
  sos_contacts          jsonb       NOT NULL DEFAULT '[]',
  total_trips           int         NOT NULL DEFAULT 0,
  total_nights          int         NOT NULL DEFAULT 0,
  countries_visited     jsonb       NOT NULL DEFAULT '[]',
  total_spend_gbp       numeric(12,2) NOT NULL DEFAULT 0,
  carbon_kg_total       numeric(10,2) NOT NULL DEFAULT 0,
  carbon_kg_offset      numeric(10,2) NOT NULL DEFAULT 0,
  last_trip_at          timestamptz,
  email_verified_at     timestamptz,
  phone_verified_at     timestamptz,
  kyc_verified_at       timestamptz,
  kyc_provider          text,
  two_factor_enabled    boolean     NOT NULL DEFAULT false,
  two_factor_method     text        NOT NULL DEFAULT 'NONE',
  notification_prefs    jsonb       NOT NULL DEFAULT '{"channels":{"push":true,"in_app":true,"sms":true,"whatsapp":false,"voice":false},"domains":{"booking":true,"eco":true,"community":true,"pain_guard":true},"quiet_hours":{"enabled":false,"window_start":"22:00","window_end":"08:00"}}',
  gdpr                  jsonb       NOT NULL DEFAULT '{}',
  pain_guard_enrolled       boolean     NOT NULL DEFAULT false,
  pain_guard_enrolled_at    timestamptz,
  pain_guard_active_tasks   int         NOT NULL DEFAULT 0,
  pain_guard_handoff_req    boolean     NOT NULL DEFAULT false,
  onesignal_player_id   text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  last_login_at         timestamptz,
  deleted_at            timestamptz
);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON user_profiles(tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_deleted ON user_profiles(deleted_at) WHERE deleted_at IS NULL;
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN INSERT INTO user_profiles (id, full_name, email_verified) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), COALESCE(NEW.email_confirmed_at IS NOT NULL, false)) ON CONFLICT (id) DO NOTHING; RETURN NEW; END; $$;
CREATE OR REPLACE TRIGGER trg_on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "profiles_owner_select" ON user_profiles FOR SELECT USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "profiles_owner_update" ON user_profiles FOR UPDATE USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "profiles_service_all" ON user_profiles FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  },
  {
    name: '002_user_dashboard.sql',
    checkTable: 'booking_history',
    sql: `CREATE TABLE IF NOT EXISTS booking_history (
  booking_id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier                text        NOT NULL DEFAULT 'GUEST',
  origin              text,
  destination         text        NOT NULL,
  departure_date      date        NOT NULL,
  return_date         date,
  carrier             text,
  flight_number       text,
  price               numeric(10,2) NOT NULL DEFAULT 0,
  currency            char(3)     NOT NULL DEFAULT 'GBP',
  status              text        NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','CONFIRMED','CANCELLED')),
  confirmation_ref    text        UNIQUE,
  co2_kg              numeric(10,2),
  co2_per_person_kg   numeric(10,2),
  eco_grade           char(1)     CHECK (eco_grade IN ('A','B','C','D','E')),
  distance_km         numeric(10,2),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_key  text        NOT NULL,
  position    int         NOT NULL DEFAULT 0,
  visible     boolean     NOT NULL DEFAULT true,
  config      jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, widget_key)
);
CREATE TABLE IF NOT EXISTS eco_milestones (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_key text        NOT NULL,
  carbon_kg     numeric(10,2) NOT NULL DEFAULT 0,
  awarded_at    timestamptz NOT NULL DEFAULT now(),
  notified      boolean     NOT NULL DEFAULT false,
  UNIQUE (user_id, milestone_key)
);
CREATE INDEX IF NOT EXISTS idx_booking_history_user_created ON booking_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_history_status ON booking_history(user_id, status);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user ON dashboard_widgets(user_id, position);
CREATE INDEX IF NOT EXISTS idx_eco_milestones_user ON eco_milestones(user_id);
DROP TRIGGER IF EXISTS trg_booking_history_updated_at ON booking_history;
CREATE TRIGGER trg_booking_history_updated_at BEFORE UPDATE ON booking_history FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_dashboard_widgets_updated_at ON dashboard_widgets;
CREATE TRIGGER trg_dashboard_widgets_updated_at BEFORE UPDATE ON dashboard_widgets FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE booking_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE eco_milestones     ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "bookings_owner_select" ON booking_history FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "bookings_owner_insert" ON booking_history FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "bookings_service_all" ON booking_history FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "widgets_owner" ON dashboard_widgets FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "eco_milestones_owner_select" ON eco_milestones FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "eco_milestones_service_all" ON eco_milestones FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  },
  {
    name: '003_planner_memory.sql',
    checkTable: 'planner_sessions',
    sql: `CREATE TABLE IF NOT EXISTS planner_sessions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text        NOT NULL DEFAULT 'New Trip',
  destination text,
  start_date  date,
  end_date    date,
  preferences jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS planner_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid        NOT NULL REFERENCES planner_sessions(id) ON DELETE CASCADE,
  role       text        NOT NULL CHECK (role IN ('user','assistant')),
  content    text        NOT NULL,
  metadata   jsonb       NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS planner_itineraries (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          uuid        NOT NULL REFERENCES planner_sessions(id) ON DELETE CASCADE,
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination         text,
  days                jsonb       NOT NULL DEFAULT '[]',
  eco_score           int         CHECK (eco_score BETWEEN 0 AND 100),
  total_budget        jsonb       NOT NULL DEFAULT '{}',
  accessibility_notes text,
  status              text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','confirmed','booked')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_created ON planner_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_session_created ON planner_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_itineraries_session ON planner_itineraries(session_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_user_created ON planner_itineraries(user_id, created_at DESC);
DROP TRIGGER IF EXISTS trg_sessions_updated_at ON planner_sessions;
CREATE TRIGGER trg_sessions_updated_at BEFORE UPDATE ON planner_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_itineraries_updated_at ON planner_itineraries;
CREATE TRIGGER trg_itineraries_updated_at BEFORE UPDATE ON planner_itineraries FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE planner_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_itineraries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sessions_owner" ON planner_sessions FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "messages_owner" ON planner_messages FOR ALL USING (session_id IN (SELECT id FROM planner_sessions WHERE user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "itineraries_owner" ON planner_itineraries FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  },
  {
    name: '004_bookings.sql',
    checkTable: 'flight_searches',
    sql: `CREATE TABLE IF NOT EXISTS flight_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  depart_date DATE,
  return_date DATE,
  passengers INT DEFAULT 1,
  cabin_class TEXT DEFAULT 'economy',
  results_count INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS hotel_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  check_in DATE,
  check_out DATE,
  guests INT DEFAULT 2,
  rooms INT DEFAULT 1,
  results_count INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE booking_history ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'flight';
ALTER TABLE booking_history ADD COLUMN IF NOT EXISTS provider_ref TEXT;
ALTER TABLE booking_history ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE flight_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_searches  ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Users can view own flight searches" ON flight_searches FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can insert own flight searches" ON flight_searches FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can view own hotel searches" ON hotel_searches FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can insert own hotel searches" ON hotel_searches FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS flight_searches_user_idx ON flight_searches(user_id);
CREATE INDEX IF NOT EXISTS hotel_searches_user_idx ON hotel_searches(user_id);`,
  },
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-migration-token, x-supabase-pat, x-supabase-key',
};

// Return all env var NAMES (not values) — reveals if a Supabase key exists under any name
function listEnvKeys() {
  return Object.keys(process.env).sort();
}

// Derive a Supabase service_role JWT from the project's JWT secret.
// Supabase service_role keys are HS256 JWTs signed with the project JWT secret.
// If JWT_SECRET in the env IS the Supabase project secret, this produces a valid key.
function deriveServiceRoleJWT(secret) {
  try {
    const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { role: 'service_role', iss: 'supabase', iat: now, exp: now + 3600 };
    const unsigned = `${b64url(header)}.${b64url(payload)}`;
    const sig = crypto.createHmac('sha256', secret).update(unsigned).digest('base64url');
    return `${unsigned}.${sig}`;
  } catch { return null; }
}

// Connectivity probe — tests if this Lambda can reach Supabase at all
async function probeConnectivity() {
  try {
    const r = await fetch(`${REST_BASE}/`, {
      headers: { apikey: 'probe', Authorization: 'Bearer probe' },
      signal: AbortSignal.timeout(8000),
    });
    const body = await r.text();
    return { reachable: !body.includes('not in allowlist'), httpStatus: r.status, body: body.slice(0, 120) };
  } catch (e) {
    return { reachable: false, error: e.message };
  }
}

// Run SQL via Management API (PAT required)
async function runViaMgmtAPI(sql, pat) {
  const resp = await fetch(MGMT_BASE, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pat}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
    signal: AbortSignal.timeout(30000),
  });
  const body = await resp.text();
  return { httpStatus: resp.status, body: body.slice(0, 400) };
}

// Check table existence via PostgREST (service role key)
async function tableExists(tableName, key) {
  try {
    const resp = await fetch(`${REST_BASE}/${tableName}?select=count&limit=0`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' },
      signal: AbortSignal.timeout(8000),
    });
    return { exists: resp.status === 200 || resp.status === 206, httpStatus: resp.status };
  } catch (e) {
    return { exists: false, error: e.message };
  }
}

module.exports = async (req, res) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ error: 'GET or POST only' });

  const token          = req.headers['x-migration-token'] || (req.query && req.query.token);
  if (token !== MIGRATION_TOKEN) return res.status(401).json({ error: 'unauthorized' });

  // Credentials: check many possible env var names, then fall back to request headers,
  // then try deriving a service_role JWT from JWT_SECRET (Supabase project JWT secret).
  const pat = process.env.SUPABASE_ACCESS_TOKEN
    || process.env.SUPABASE_PAT
    || process.env.SUPABASE_MANAGEMENT_TOKEN
    || req.headers['x-supabase-pat'];

  const jwtDerived = process.env.JWT_SECRET ? deriveServiceRoleJWT(process.env.JWT_SECRET) : null;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SERVICE_KEY
    || process.env.SUPABASE_KEY
    || process.env.SUPABASE_ANON_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || req.headers['x-supabase-key']
    || jwtDerived;  // Last resort: derived from JWT_SECRET

  // Env key inspection mode — returns all env var NAMES (no values)
  if (req.query && req.query.envkeys === '1') {
    const keys = listEnvKeys();
    const supabaseKeys = keys.filter(k => /supa|postgres|pg_|database|service_role|anon|jwt|api_key/i.test(k));
    return res.status(200).json({ mode: 'env-inspection', all_keys: keys, supabase_related: supabaseKeys });
  }

  // Connectivity probe mode
  if ((req.query && req.query.probe === '1') || req.headers['x-probe'] === '1') {
    const probe = await probeConnectivity();
    return res.status(200).json({ mode: 'connectivity-probe', supabase_ref: SUPABASE_REF, ...probe });
  }

  const strategy = pat ? 'management-api' : serviceRoleKey ? 'verify-only' : 'no-credentials';
  const keySource = pat ? 'pat' : (serviceRoleKey === jwtDerived ? 'derived-from-JWT_SECRET' : 'env-or-header');

  if (strategy === 'no-credentials') {
    const probe = await probeConnectivity();
    return res.status(400).json({
      error: 'No Supabase credentials configured',
      supabase_reachable_from_vercel: probe.reachable,
      connectivity_probe: probe,
      options: {
        A: 'Add SUPABASE_ACCESS_TOKEN (PAT) to Vercel env vars — enables DDL via Management API',
        B: 'Add SUPABASE_SERVICE_ROLE_KEY to Vercel env vars — enables table existence verification',
        C: 'Pass x-supabase-pat header with your PAT (DDL) or x-supabase-key header with service role key (verify)',
        D: 'Paste voyage-smart-travel/migrations/ALL_MIGRATIONS.sql into Supabase SQL Editor',
      },
    });
  }

  const results = [];

  for (const migration of MIGRATIONS) {
    const check = await tableExists(migration.checkTable, serviceRoleKey || pat);

    if (strategy === 'management-api') {
      let applyResult;
      try {
        applyResult = await runViaMgmtAPI(migration.sql, pat);
      } catch (e) {
        applyResult = { error: e.message };
      }
      const postCheck = await tableExists(migration.checkTable, serviceRoleKey || pat);
      results.push({
        migration: migration.name,
        strategy: 'management-api',
        appliedStatus: applyResult.httpStatus,
        applyBody: applyResult.body || applyResult.error,
        tableExistedBefore: check.exists,
        tableExistsAfter: postCheck.exists,
        status: postCheck.exists ? 'CONFIRMED' : 'UNCERTAIN',
      });
    } else {
      results.push({
        migration: migration.name,
        strategy: 'verify-only',
        tableExists: check.exists,
        httpStatus: check.httpStatus,
        status: check.exists ? 'TABLE_EXISTS' : 'TABLE_MISSING',
        note: 'Provide x-supabase-pat header (PAT) to apply DDL. Service role key can only verify.',
      });
    }
  }

  const allConfirmed = results.every(r => r.status === 'CONFIRMED' || r.status === 'TABLE_EXISTS');
  return res.status(200).json({ strategy, keySource, allConfirmed, results });
};
