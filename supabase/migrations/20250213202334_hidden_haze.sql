-- Add foreign key to link calendar_events to club_details via user_id
ALTER TABLE calendar_events
DROP CONSTRAINT IF EXISTS calendar_events_club_details_fkey;

-- Create a foreign key relationship between calendar_events and club_details
ALTER TABLE calendar_events
ADD CONSTRAINT calendar_events_club_details_fkey
FOREIGN KEY (user_id) REFERENCES club_details(user_id);

-- Update the policy for public calendar events to include club details
DROP POLICY IF EXISTS "Anyone can view public calendar events" ON calendar_events;

CREATE POLICY "Anyone can view public calendar events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    access = 'public'
  );