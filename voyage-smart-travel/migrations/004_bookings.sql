-- Flight search history
CREATE TABLE IF NOT EXISTS flight_searches (
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

-- Hotel search history
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

-- Update booking_history with type column
ALTER TABLE booking_history ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'flight';
ALTER TABLE booking_history ADD COLUMN IF NOT EXISTS provider_ref TEXT;
ALTER TABLE booking_history ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

-- RLS
ALTER TABLE flight_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flight searches" ON flight_searches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flight searches" ON flight_searches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own hotel searches" ON hotel_searches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own hotel searches" ON hotel_searches FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS flight_searches_user_idx ON flight_searches(user_id);
CREATE INDEX IF NOT EXISTS hotel_searches_user_idx ON hotel_searches(user_id);
