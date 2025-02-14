/*
  # Fix weighing access permissions

  1. Changes
    - Drop existing table and policies
    - Recreate table with correct structure
    - Add proper RLS policies for weighing access
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS weighing_access_links;

-- Create weighing_access_links table
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

-- Create policies
CREATE POLICY "Users can create weighing access links for their competitions"
  ON weighing_access_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM saved_competitions
      WHERE id = competition_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view weighing access links they created"
  ON weighing_access_links
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete weighing access links they created"
  ON weighing_access_links
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());