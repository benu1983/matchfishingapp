/*
  # Add coordinates columns to calendar_events table

  1. Changes
    - Add latitude and longitude columns to calendar_events table
    - Make them nullable since not all addresses might be geocodeable
    - Add index for faster geospatial queries
*/

-- Add coordinates columns if they don't exist
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

-- Add index for geospatial queries
CREATE INDEX IF NOT EXISTS calendar_events_coordinates_idx 
ON calendar_events (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comment explaining the coordinates
COMMENT ON COLUMN calendar_events.latitude IS 'Latitude coordinate for the event location';
COMMENT ON COLUMN calendar_events.longitude IS 'Longitude coordinate for the event location';