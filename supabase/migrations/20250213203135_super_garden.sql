-- Drop existing constraints and policies
DROP POLICY IF EXISTS "Anyone can view public calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Anyone can view public calendar events (anon)" ON calendar_events;
DROP CONSTRAINT IF EXISTS calendar_events_club_details_fkey;

-- Create a foreign key relationship between calendar_events and club_details
ALTER TABLE calendar_events
ADD CONSTRAINT calendar_events_club_details_fkey
FOREIGN KEY (user_id) REFERENCES club_details(user_id);

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

-- Create policy for public club details
DROP POLICY IF EXISTS "Public club details for calendar events" ON club_details;

CREATE POLICY "Public club details for calendar events"
  ON club_details
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events
      WHERE calendar_events.user_id = club_details.user_id
      AND calendar_events.access = 'public'
    )
    AND (
      (public_name = true AND name IS NOT NULL) OR
      (public_address = true AND (street IS NOT NULL OR postal_code IS NOT NULL OR city IS NOT NULL OR country IS NOT NULL)) OR
      (public_phone = true AND phone_numbers IS NOT NULL) OR
      (public_rules = true AND rules_file_url IS NOT NULL) OR
      (public_website = true AND website IS NOT NULL) OR
      (public_email = true AND email IS NOT NULL) OR
      (public_social_media = true AND social_media IS NOT NULL)
    )
  );