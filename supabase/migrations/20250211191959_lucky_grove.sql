-- Drop and recreate all constraints for calendar_events
DO $$ 
BEGIN
  -- Drop existing constraints
  ALTER TABLE calendar_events 
    DROP CONSTRAINT IF EXISTS calendar_events_format_check,
    DROP CONSTRAINT IF EXISTS calendar_events_type_check,
    DROP CONSTRAINT IF EXISTS calendar_events_access_check,
    DROP CONSTRAINT IF EXISTS calendar_events_water_type_check;

  -- Recreate all constraints
  ALTER TABLE calendar_events
    ADD CONSTRAINT calendar_events_format_check 
      CHECK (format IN ('single', 'pair', 'trio', 'other')),
    ADD CONSTRAINT calendar_events_type_check 
      CHECK (type IN ('fixed-rod', 'feeder', 'open', 'open-float')),
    ADD CONSTRAINT calendar_events_access_check 
      CHECK (access IN ('members-only', 'public')),
    ADD CONSTRAINT calendar_events_water_type_check 
      CHECK (water_type IN ('public', 'bream-pond', 'carp-pond', 'allround-pond'));

  -- Set default values
  ALTER TABLE calendar_events 
    ALTER COLUMN format SET DEFAULT 'single',
    ALTER COLUMN type SET DEFAULT 'fixed-rod',
    ALTER COLUMN access SET DEFAULT 'members-only',
    ALTER COLUMN water_type SET DEFAULT 'public';
END $$;