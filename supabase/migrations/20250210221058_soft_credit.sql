-- Drop existing table and policies
DROP TABLE IF EXISTS weighing_access_links;

-- Recreate weighing_access_links table
CREATE TABLE weighing_access_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL,
  sectors text[] NOT NULL,
  email text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users NOT NULL,
  FOREIGN KEY (competition_id) REFERENCES saved_competitions(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE weighing_access_links ENABLE ROW LEVEL SECURITY;

-- Create policies with fixed permissions
CREATE POLICY "Anyone can view weighing access links"
  ON weighing_access_links
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create weighing access links for their competitions"
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

CREATE POLICY "Users can delete their own weighing access links"
  ON weighing_access_links
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());