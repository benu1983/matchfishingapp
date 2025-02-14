/*
  # Add policy for anonymous users to view public club details

  1. Changes
    - Add new policy to allow anonymous users to view public club details
  2. Security
    - Only allows viewing fields marked as public
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
    AND tablename = 'club_details' 
    AND policyname = 'Anyone can view public club details (anon)'
  ) THEN
    DROP POLICY "Anyone can view public club details (anon)" ON club_details;
  END IF;
END $$;

-- Create policy for anonymous users
CREATE POLICY "Anyone can view public club details (anon)"
  ON club_details
  FOR SELECT
  TO anon
  USING (
    (public_name = true AND name IS NOT NULL) OR
    (public_address = true AND (street IS NOT NULL OR postal_code IS NOT NULL OR city IS NOT NULL OR country IS NOT NULL)) OR
    (public_phone = true AND phone_numbers IS NOT NULL) OR
    (public_rules = true AND rules_file_url IS NOT NULL) OR
    (public_website = true AND website IS NOT NULL) OR
    (public_email = true AND email IS NOT NULL)
  );

COMMIT;