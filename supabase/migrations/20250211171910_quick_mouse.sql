/*
  # Fix rod type constraints

  1. Changes
    - Add proper check constraint for rod types in calendar_events table
    - Ensure all rod types match the allowed values from the frontend
*/

-- Drop existing type check constraint if it exists
ALTER TABLE calendar_events 
  DROP CONSTRAINT IF EXISTS calendar_events_type_check;

-- Add updated type check constraint
ALTER TABLE calendar_events
  ADD CONSTRAINT calendar_events_type_check 
    CHECK (type IN ('fixed-rod', 'feeder', 'open', 'open-float'));