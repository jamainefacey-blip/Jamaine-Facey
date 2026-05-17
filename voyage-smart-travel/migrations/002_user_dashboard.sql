-- VST Migration 002 — User Dashboard & Booking History
-- Run against Supabase project: ovmlmregvcekbvoctywe
-- Requires: auth.users (Supabase Auth), migration 001 (user_profiles)

-- ── booking_history ───────────────────────────────────────────────────────────
-- Core booking record — extended by migration 004 (booking_type, provider_ref, details)
CREATE TABLE IF NOT EXISTS booking_history (
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
  status              text        NOT NULL DEFAULT 'PENDING'
                                  CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
  confirmation_ref    text        UNIQUE,
  co2_kg              numeric(10,2),
  co2_per_person_kg   numeric(10,2),
  eco_grade           char(1)     CHECK (eco_grade IN ('A','B','C','D','E')),
  distance_km         numeric(10,2),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ── dashboard_widgets ─────────────────────────────────────────────────────────
-- Per-user widget layout and visibility preferences
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

-- ── eco_milestones ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eco_milestones (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_key text        NOT NULL,
  carbon_kg     numeric(10,2) NOT NULL DEFAULT 0,
  awarded_at    timestamptz NOT NULL DEFAULT now(),
  notified      boolean     NOT NULL DEFAULT false,
  UNIQUE (user_id, milestone_key)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_booking_history_user_created
  ON booking_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_history_status
  ON booking_history(user_id, status);

CREATE INDEX IF NOT EXISTS idx_booking_history_departure
  ON booking_history(user_id, departure_date);

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user
  ON dashboard_widgets(user_id, position);

CREATE INDEX IF NOT EXISTS idx_eco_milestones_user
  ON eco_milestones(user_id);

-- ── updated_at triggers ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_booking_history_updated_at
  BEFORE UPDATE ON booking_history
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_dashboard_widgets_updated_at
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE booking_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE eco_milestones     ENABLE ROW LEVEL SECURITY;

-- booking_history: owner + service role
CREATE POLICY "bookings_owner_select" ON booking_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "bookings_owner_insert" ON booking_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookings_service_all" ON booking_history
  FOR ALL USING (auth.role() = 'service_role');

-- dashboard_widgets: owner only
CREATE POLICY "widgets_owner" ON dashboard_widgets
  FOR ALL USING (auth.uid() = user_id);

-- eco_milestones: owner read, service write
CREATE POLICY "eco_milestones_owner_select" ON eco_milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "eco_milestones_service_all" ON eco_milestones
  FOR ALL USING (auth.role() = 'service_role');
