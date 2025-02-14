-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view public club details" ON club_details;
DROP POLICY IF EXISTS "Anyone can view public club details (anon)" ON club_details;
DROP POLICY IF EXISTS "Public club details for calendar events" ON club_details;

-- Create updated policies for club details
CREATE POLICY "Anyone can view public club details"
  ON club_details
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    (
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
    )
  );

-- Create policy for anonymous users
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