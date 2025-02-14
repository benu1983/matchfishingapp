-- Add water_type column to calendar_events
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'water_type'
  ) THEN
    ALTER TABLE calendar_events 
      ADD COLUMN water_type text NOT NULL DEFAULT 'public'
      CHECK (water_type IN ('public', 'bream-pond', 'carp-pond', 'allround-pond'));
  END IF;
END $$;