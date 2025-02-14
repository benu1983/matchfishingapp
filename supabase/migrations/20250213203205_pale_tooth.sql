-- Drop existing constraints and policies
DROP POLICY IF EXISTS "Anyone can view public calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Anyone can view public calendar events (anon)" ON calendar_events;
DROP CONSTRAINT IF EXISTS calendar_events_club_details_fkey;
DROP CONSTRAINT IF EXISTS calendar_events_user_id_fkey;

-- Add foreign key constraints
ALTER TABLE calendar_events
ADD CONSTRAINT calendar_events_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Create policies for calendar events
CREATE POLICY "Anyone can view public calendar events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    access = 'public'
  );

CREATE POLICY "Anyone can view public calendar events (anon)"
  ON calendar_events
  FOR SELECT
  TO anon
  USING (
    access = 'public'
  );

-- Update club details policies
DROP POLICY IF EXISTS "Anyone can view public club details" ON club_details;
DROP POLICY IF EXISTS "Anyone can view public club details (anon)" ON club_details;

CREATE POLICY "Anyone can view public club details"
  ON club_details
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM calendar_events
      WHERE calendar_events.user_id = club_details.user_id
      AND calendar_events.access = 'public'
    )
  );

CREATE POLICY "Anyone can view public club details (anon)"
  ON club_details
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events
      WHERE calendar_events.user_id = club_details.user_id
      AND calendar_events.access = 'public'
    )
  );