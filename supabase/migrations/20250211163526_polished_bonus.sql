/*
  # Update Calendar Event Format Constraint

  1. Changes
    - Drop existing format check constraint
    - Add new format check constraint with all valid values
    - Add default value for format column
*/

-- Drop existing format check constraint
ALTER TABLE calendar_events 
  DROP CONSTRAINT IF EXISTS calendar_events_format_check;

-- Add updated format check constraint
ALTER TABLE calendar_events
  ADD CONSTRAINT calendar_events_format_check 
    CHECK (format IN ('single', 'pair', 'trio', 'other'));

-- Set default value for format column
ALTER TABLE calendar_events
  ALTER COLUMN format SET DEFAULT 'single';