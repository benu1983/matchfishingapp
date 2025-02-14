-- Add policy for public calendar events
CREATE POLICY "Anyone can view public calendar events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (
    access = 'public' OR
    auth.uid() = user_id
  );