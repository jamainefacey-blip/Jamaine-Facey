'use strict';
// Temporary migration runner — DELETE this file after all 4 migrations confirmed applied
// Auth: static token below (repo is public; function is idempotent and temporary)
const MIGRATION_TOKEN = 'vst-mig-2026-a8b3c4d5';

const SUPABASE_REF = 'ovmlmregvcekbvoctywe';
const MGMT_BASE    = `https://api.supabase.com/v1/projects/${SUPABASE_REF}/database/query`;
const REST_BASE    = `https://${SUPABASE_REF}.supabase.co/rest/v1`;

// First table created by each migration — used for existence checks
const MIGRATIONS = [
  {
    name: '001_user_profiles.sql',
    checkTable: 'user_profiles',
    sql: `CREATE TABLE IF NOT EXISTS public.user_profiles (
  id            uuid        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name  text,
  bio           text,
  avatar_url    text,
  travel_preferences jsonb   DEFAULT '{}',
  member_since  timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_profiles' AND policyname='Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_profiles' AND policyname='Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_profiles' AND policyname='Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$ BEGIN INSERT INTO public.user_profiles (id, display_name) VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))) ON CONFLICT (id) DO NOTHING; RETURN new; END; $$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE OR REPLACE FUNCTION public.update_updated_at() RETURNS trigger AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS set_updated_at ON public.user_profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();`,
  },
  {
    name: '002_user_dashboard.sql',
    checkTable: 'saved_trips',
    sql: `CREATE TABLE IF NOT EXISTS public.saved_trips (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  destination   text        NOT NULL,
  start_date    date,
  end_date      date,
  itinerary     jsonb       DEFAULT '{}',
  eco_score     integer     DEFAULT 0 CHECK (eco_score BETWEEN 0 AND 100),
  cover_url     text,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE public.saved_trips ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='saved_trips' AND policyname='Users can manage own saved trips') THEN
    CREATE POLICY "Users can manage own saved trips" ON public.saved_trips FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS saved_trips_user_id_idx ON public.saved_trips (user_id);
CREATE TABLE IF NOT EXISTS public.booking_history (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trip_id       uuid        REFERENCES public.saved_trips(id) ON DELETE SET NULL,
  destination   text,
  status        text        DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  total_cost    numeric(10,2),
  currency      text        DEFAULT 'USD',
  booked_at     timestamptz DEFAULT now()
);
ALTER TABLE public.booking_history ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='booking_history' AND policyname='Users can manage own bookings') THEN
    CREATE POLICY "Users can manage own bookings" ON public.booking_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS booking_history_user_id_idx ON public.booking_history (user_id);
CREATE TABLE IF NOT EXISTS public.travel_stats (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_trips       integer     DEFAULT 0,
  countries_visited integer     DEFAULT 0,
  co2_saved_kg      numeric(10,2) DEFAULT 0,
  eco_grade         text        DEFAULT 'C' CHECK (eco_grade IN ('A+','A','B','C','D','F')),
  updated_at        timestamptz DEFAULT now()
);
ALTER TABLE public.travel_stats ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='travel_stats' AND policyname='Users can manage own stats') THEN
    CREATE POLICY "Users can manage own stats" ON public.travel_stats FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
CREATE OR REPLACE FUNCTION public.handle_new_user_stats() RETURNS trigger AS $$ BEGIN INSERT INTO public.travel_stats (user_id) VALUES (new.id) ON CONFLICT (user_id) DO NOTHING; RETURN new; END; $$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created_stats ON auth.users;
CREATE TRIGGER on_auth_user_created_stats AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_stats();`,
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
  role       text        NOT NULL CHECK (role IN ('user', 'assistant')),
  content    text        NOT NULL,
  metadata   jsonb       NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS planner_itineraries (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         uuid        NOT NULL REFERENCES planner_sessions(id) ON DELETE CASCADE,
  user_id            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination        text,
  days               jsonb       NOT NULL DEFAULT '[]',
  eco_score          int         CHECK (eco_score BETWEEN 0 AND 100),
  total_budget       jsonb       NOT NULL DEFAULT '{}',
  accessibility_notes text,
  status             text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'booked')),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_created ON planner_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_session_created ON planner_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_itineraries_session ON planner_itineraries(session_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_user_created ON planner_itineraries(user_id, created_at DESC);
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_sessions_updated_at ON planner_sessions;
CREATE TRIGGER trg_sessions_updated_at BEFORE UPDATE ON planner_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_itineraries_updated_at ON planner_itineraries;
CREATE TRIGGER trg_itineraries_updated_at BEFORE UPDATE ON planner_itineraries FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE planner_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_itineraries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='planner_sessions' AND policyname='sessions_owner') THEN
    CREATE POLICY "sessions_owner" ON planner_sessions FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='planner_messages' AND policyname='messages_owner') THEN
    CREATE POLICY "messages_owner" ON planner_messages FOR ALL USING (session_id IN (SELECT id FROM planner_sessions WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='planner_itineraries' AND policyname='itineraries_owner') THEN
    CREATE POLICY "itineraries_owner" ON planner_itineraries FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;`,
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
ALTER TABLE hotel_searches ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='flight_searches' AND policyname='Users can view own flight searches') THEN
    CREATE POLICY "Users can view own flight searches" ON flight_searches FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='flight_searches' AND policyname='Users can insert own flight searches') THEN
    CREATE POLICY "Users can insert own flight searches" ON flight_searches FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hotel_searches' AND policyname='Users can view own hotel searches') THEN
    CREATE POLICY "Users can view own hotel searches" ON hotel_searches FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hotel_searches' AND policyname='Users can insert own hotel searches') THEN
    CREATE POLICY "Users can insert own hotel searches" ON hotel_searches FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS flight_searches_user_idx ON flight_searches(user_id);
CREATE INDEX IF NOT EXISTS hotel_searches_user_idx ON hotel_searches(user_id);`,
  },
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-migration-token',
};

// Run SQL via Supabase Management API (requires PAT, not service role key)
async function runViaMgmtAPI(sql, pat) {
  const resp = await fetch(MGMT_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pat}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const body = await resp.text();
  return { httpStatus: resp.status, body: body.slice(0, 400) };
}

// Check table existence via PostgREST with service role key (read-only)
async function tableExists(tableName, serviceRoleKey) {
  try {
    const resp = await fetch(`${REST_BASE}/${tableName}?select=count&limit=0`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: 'count=exact',
      },
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

  const token           = req.headers['x-migration-token'] || (req.query && req.query.token);
  const pat             = process.env.SUPABASE_ACCESS_TOKEN;
  const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (token !== MIGRATION_TOKEN) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  // Determine strategy
  const strategy = pat ? 'management-api' : serviceRoleKey ? 'verify-only' : 'no-credentials';

  if (strategy === 'no-credentials') {
    return res.status(400).json({
      error: 'No Supabase credentials configured',
      required: 'Set SUPABASE_ACCESS_TOKEN (Supabase PAT) in Vercel env vars to apply migrations',
      hint: 'Get a PAT at https://supabase.com/dashboard/account/tokens',
    });
  }

  const results = [];

  for (const migration of MIGRATIONS) {
    const check = await tableExists(migration.checkTable, serviceRoleKey || pat);

    if (strategy === 'management-api') {
      // Apply migration then verify
      let applyResult;
      try {
        applyResult = await runViaMgmtAPI(migration.sql, pat);
      } catch (e) {
        applyResult = { error: e.message };
      }

      // Re-verify after apply
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
      // verify-only: can check but not apply
      results.push({
        migration: migration.name,
        strategy: 'verify-only',
        tableExists: check.exists,
        httpStatus: check.httpStatus,
        status: check.exists ? 'TABLE_EXISTS' : 'TABLE_MISSING',
        note: 'Set SUPABASE_ACCESS_TOKEN to apply. Service role key cannot run DDL.',
      });
    }
  }

  const allConfirmed = results.every(r => r.status === 'CONFIRMED' || r.status === 'TABLE_EXISTS');

  return res.status(200).json({
    strategy,
    allConfirmed,
    results,
  });
};
