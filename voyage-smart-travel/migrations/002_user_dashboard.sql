-- ─────────────────────────────────────────────────────────────────────────────
-- VST Migration 002 — User Dashboard (Saved Trips, Bookings, Stats)
-- Run after 001_user_profiles.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Saved itineraries / trip plans
CREATE TABLE IF NOT EXISTS public.saved_trips (
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

CREATE POLICY "Users can manage own saved trips"
  ON public.saved_trips FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS saved_trips_user_id_idx ON public.saved_trips (user_id);

-- Booking history
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

CREATE POLICY "Users can manage own bookings"
  ON public.booking_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS booking_history_user_id_idx ON public.booking_history (user_id);

-- Aggregate travel stats (updated via trigger or app logic)
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

CREATE POLICY "Users can manage own stats"
  ON public.travel_stats FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-create stats row alongside profile
CREATE OR REPLACE FUNCTION public.handle_new_user_stats()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.travel_stats (user_id) VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_stats ON auth.users;
CREATE TRIGGER on_auth_user_created_stats
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_stats();
