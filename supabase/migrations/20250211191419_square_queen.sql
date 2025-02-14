-- Add water_type column and update format constraint
DO $$ 
BEGIN
  -- Add water_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'water_type'
  ) THEN
    ALTER TABLE calendar_events 
      ADD COLUMN water_type text NOT NULL DEFAULT 'public'
      CHECK (water_type IN ('public', 'bream-pond', 'carp-pond', 'allround-pond'));
  END IF;

  -- Drop existing format check constraint if it exists
  ALTER TABLE calendar_events 
    DROP CONSTRAINT IF EXISTS calendar_events_format_check;

  -- Add updated format check constraint
  ALTER TABLE calendar_events
    ADD CONSTRAINT calendar_events_format_check 
    CHECK (format IN ('single', 'pair', 'trio', 'other'));
END $$;