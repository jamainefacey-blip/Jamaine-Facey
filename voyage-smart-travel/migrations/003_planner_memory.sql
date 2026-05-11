-- VST Migration 003 — Planner Memory System
-- Run against Supabase project: ovmlmregvcekbvoctywe
-- Requires: auth.users (Supabase Auth)

-- ── planner_sessions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS planner_sessions (
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

-- ── planner_messages ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS planner_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid        NOT NULL REFERENCES planner_sessions(id) ON DELETE CASCADE,
  role       text        NOT NULL CHECK (role IN ('user', 'assistant')),
  content    text        NOT NULL,
  metadata   jsonb       NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── planner_itineraries ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS planner_itineraries (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         uuid        NOT NULL REFERENCES planner_sessions(id) ON DELETE CASCADE,
  user_id            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination        text,
  days               jsonb       NOT NULL DEFAULT '[]',
  eco_score          int         CHECK (eco_score BETWEEN 0 AND 100),
  total_budget       jsonb       NOT NULL DEFAULT '{}',
  accessibility_notes text,
  status             text        NOT NULL DEFAULT 'draft'
                                 CHECK (status IN ('draft', 'confirmed', 'booked')),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_user_created
  ON planner_sessions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_session_created
  ON planner_messages(session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_itineraries_session
  ON planner_itineraries(session_id);

CREATE INDEX IF NOT EXISTS idx_itineraries_user_created
  ON planner_itineraries(user_id, created_at DESC);

-- ── updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON planner_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_itineraries_updated_at
  BEFORE UPDATE ON planner_itineraries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE planner_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_itineraries ENABLE ROW LEVEL SECURITY;

-- Sessions: owner only
CREATE POLICY "sessions_owner" ON planner_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Messages: accessible if the parent session belongs to the user
CREATE POLICY "messages_owner" ON planner_messages
  FOR ALL USING (
    session_id IN (
      SELECT id FROM planner_sessions WHERE user_id = auth.uid()
    )
  );

-- Itineraries: owner only
CREATE POLICY "itineraries_owner" ON planner_itineraries
  FOR ALL USING (auth.uid() = user_id);
