-- VST Migration 001 — User Profiles
-- Run against Supabase project: ovmlmregvcekbvoctywe
-- Requires: auth.users (Supabase Auth)

-- ── user_profiles ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id                    uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier                  text        NOT NULL DEFAULT 'GUEST'
                                    CHECK (tier IN ('GUEST', 'PREMIUM', 'VOYAGE_ELITE')),

  -- Identity
  full_name             text        NOT NULL DEFAULT '',
  preferred_name        text        NOT NULL DEFAULT '',
  avatar_url            text,
  date_of_birth         date,
  nationality           char(2),
  passport_number       text,
  passport_expiry       date,
  kyc_status            text        NOT NULL DEFAULT 'NOT_STARTED'
                                    CHECK (kyc_status IN ('NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED')),
  phone                 text,
  phone_verified        boolean     NOT NULL DEFAULT false,
  email_verified        boolean     NOT NULL DEFAULT false,

  -- Preferences
  locale                text        NOT NULL DEFAULT 'en-GB',
  timezone              text        NOT NULL DEFAULT 'Europe/London',
  currency              char(3)     NOT NULL DEFAULT 'GBP',
  home_airport          char(3),
  cabin_class           text        NOT NULL DEFAULT 'ECONOMY'
                                    CHECK (cabin_class IN ('ECONOMY','PREMIUM_ECONOMY','BUSINESS','FIRST')),
  seat_preference       text        NOT NULL DEFAULT 'NO_PREFERENCE',
  meal_preference       text        NOT NULL DEFAULT 'STANDARD',
  loyalty_programs      jsonb       NOT NULL DEFAULT '[]',

  -- Accessibility
  mobility              text        NOT NULL DEFAULT 'NONE',
  wheelchair_type       text        NOT NULL DEFAULT 'NOT_APPLICABLE',
  vision                text        NOT NULL DEFAULT 'NONE',
  hearing               text        NOT NULL DEFAULT 'NONE',
  cognitive             boolean     NOT NULL DEFAULT false,
  dietary_medical       jsonb       NOT NULL DEFAULT '[]',
  requires_carer        boolean     NOT NULL DEFAULT false,
  accessibility_notes   text        NOT NULL DEFAULT '',

  -- SOS contacts (up to 5, stored as JSONB array)
  sos_contacts          jsonb       NOT NULL DEFAULT '[]',

  -- Travel history stats
  total_trips           int         NOT NULL DEFAULT 0,
  total_nights          int         NOT NULL DEFAULT 0,
  countries_visited     jsonb       NOT NULL DEFAULT '[]',
  total_spend_gbp       numeric(12,2) NOT NULL DEFAULT 0,
  carbon_kg_total       numeric(10,2) NOT NULL DEFAULT 0,
  carbon_kg_offset      numeric(10,2) NOT NULL DEFAULT 0,
  last_trip_at          timestamptz,

  -- Verification
  email_verified_at     timestamptz,
  phone_verified_at     timestamptz,
  kyc_verified_at       timestamptz,
  kyc_provider          text,
  two_factor_enabled    boolean     NOT NULL DEFAULT false,
  two_factor_method     text        NOT NULL DEFAULT 'NONE',

  -- Notification preferences
  notification_prefs    jsonb       NOT NULL DEFAULT '{
    "channels":  {"push": true, "in_app": true, "sms": true, "whatsapp": false, "voice": false},
    "domains":   {"booking": true, "eco": true, "community": true, "pain_guard": true},
    "quiet_hours": {"enabled": false, "window_start": "22:00", "window_end": "08:00"}
  }',

  -- GDPR
  gdpr                  jsonb       NOT NULL DEFAULT '{}',

  -- Pain Guard
  pain_guard_enrolled       boolean     NOT NULL DEFAULT false,
  pain_guard_enrolled_at    timestamptz,
  pain_guard_active_tasks   int         NOT NULL DEFAULT 0,
  pain_guard_handoff_req    boolean     NOT NULL DEFAULT false,

  -- OneSignal
  onesignal_player_id   text,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  last_login_at         timestamptz,
  deleted_at            timestamptz
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier
  ON user_profiles(tier);

CREATE INDEX IF NOT EXISTS idx_user_profiles_deleted
  ON user_profiles(deleted_at)
  WHERE deleted_at IS NULL;

-- ── updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Auto-create profile on signup ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, email_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_owner_select" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_owner_update" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_service_all" ON user_profiles
  FOR ALL USING (auth.role() = 'service_role');
