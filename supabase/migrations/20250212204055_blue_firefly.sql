-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view weighing access links" ON weighing_access_links;

-- Create updated policy that includes competition details
CREATE POLICY "Anyone can view weighing access links and competitions"
  ON weighing_access_links
  FOR SELECT
  TO authenticated
  USING (
    -- User can view if they created the link or are the recipient
    created_by = auth.uid() OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Add policy to allow viewing associated competition details
CREATE POLICY "Users can view competitions through weighing access"
  ON saved_competitions
  FOR SELECT
  TO authenticated
  USING (
    -- User can view if they own the competition or have a valid weighing access link
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM weighing_access_links
      WHERE competition_id = id
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND expires_at > now()
    )
  );