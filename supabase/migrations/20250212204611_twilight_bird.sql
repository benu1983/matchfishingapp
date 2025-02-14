-- Start transaction
BEGIN;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own competitions" ON saved_competitions;
DROP POLICY IF EXISTS "Users can view their own competitions" ON saved_competitions;
DROP POLICY IF EXISTS "Users can update their own competitions" ON saved_competitions;
DROP POLICY IF EXISTS "Users can delete their own competitions" ON saved_competitions;
DROP POLICY IF EXISTS "Anyone can view weighing access links and competitions" ON weighing_access_links;
DROP POLICY IF EXISTS "Users can view competitions through weighing access" ON saved_competitions;

-- Create updated policies for saved_competitions
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

-- Create updated policies for weighing_access_links
CREATE POLICY "Users can create weighing access links"
  ON weighing_access_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM saved_competitions
      WHERE id = competition_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view weighing access links"
  ON weighing_access_links
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    email = auth.email()
  );

CREATE POLICY "Users can delete weighing access links"
  ON weighing_access_links
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Enable RLS on both tables (in case it was disabled)
ALTER TABLE saved_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weighing_access_links ENABLE ROW LEVEL SECURITY;

COMMIT;