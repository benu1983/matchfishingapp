/*
  # Update Calendar Event Constraints

  1. Changes
    - Update format check constraint to include 'other' value
    - Update access check constraint to include 'members-only' and 'public' values
*/

-- Drop existing check constraints
ALTER TABLE calendar_events 
  DROP CONSTRAINT IF EXISTS calendar_events_format_check,
  DROP CONSTRAINT IF EXISTS calendar_events_access_check;

-- Add updated check constraints
ALTER TABLE calendar_events
  ADD CONSTRAINT calendar_events_format_check 
    CHECK (format IN ('single', 'pair', 'trio', 'other')),
  ADD CONSTRAINT calendar_events_access_check 
    CHECK (access IN ('members-only', 'public'));