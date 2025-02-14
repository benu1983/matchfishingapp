/*
  # Add policy for anonymous users to view public calendar events

  1. Changes
    - Add new policy to allow anonymous users to view public calendar events
  2. Security
    - Only allows viewing public events
    - No write access for anonymous users
*/

-- Wrap in a transaction to ensure atomic execution
BEGIN;

-- Safely drop existing policy if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'calendar_events' 
    AND policyname = 'Anyone can view public calendar events (anon)'
  ) THEN
    DROP POLICY "Anyone can view public calendar events (anon)" ON calendar_events;
  END IF;
END $$;

-- Create policy for anonymous users
CREATE POLICY "Anyone can view public calendar events (anon)"
  ON calendar_events
  FOR SELECT
  TO anon
  USING (access = 'public');

COMMIT;