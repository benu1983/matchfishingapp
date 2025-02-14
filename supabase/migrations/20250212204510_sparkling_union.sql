-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own competitions" ON saved_competitions;
DROP POLICY IF EXISTS "Users can view their own competitions" ON saved_competitions;
DROP POLICY IF EXISTS "Users can update their own competitions" ON saved_competitions;
DROP POLICY IF EXISTS "Users can delete their own competitions" ON saved_competitions;

-- Create updated policies that don't rely on users table
CREATE POLICY "Users can create their own competitions"
  ON saved_competitions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own competitions"
  ON saved_competitions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM weighing_access_links
      WHERE competition_id = id
      AND email = auth.email()
      AND expires_at > now()
    )
  );

CREATE POLICY "Users can update their own competitions"
  ON saved_competitions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitions"
  ON saved_competitions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update weighing access links policy to use auth.email() instead of users table
DROP POLICY IF EXISTS "Anyone can view weighing access links and competitions" ON weighing_access_links;

CREATE POLICY "Anyone can view weighing access links and competitions"
  ON weighing_access_links
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    email = auth.email()
  );