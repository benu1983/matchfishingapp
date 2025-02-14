-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view public club details" ON club_details;

-- Create policy for public access
CREATE POLICY "Anyone can view public club details"
  ON club_details
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    (
      (public_name = true AND name IS NOT NULL) OR
      (public_address = true AND (street IS NOT NULL OR postal_code IS NOT NULL OR city IS NOT NULL OR country IS NOT NULL)) OR
      (public_phone = true AND phone_numbers IS NOT NULL) OR
      (public_rules = true AND rules_file_url IS NOT NULL) OR
      (public_website = true AND website IS NOT NULL) OR
      (public_email = true AND email IS NOT NULL)
    )
  );