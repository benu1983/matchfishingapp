-- Add latitude and longitude columns to calendar_events
DO $$ 
BEGIN
  -- Add latitude column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN latitude double precision;
  END IF;

  -- Add longitude column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN longitude double precision;
  END IF;
END $$;