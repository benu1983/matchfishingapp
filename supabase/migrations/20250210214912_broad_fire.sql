/*
  # Add weighing access functionality
  
  1. New Tables
    - `weighing_access_links`
      - `id` (uuid, primary key) - Unique identifier for the access link
      - `competition_id` (uuid) - Reference to the competition
      - `sectors` (text[]) - Array of sector letters (A, B, C, etc.)
      - `email` (text) - Email address of the person who gets access
      - `expires_at` (timestamptz) - When the access link expires
      - `created_at` (timestamptz) - When the access link was created
      - `created_by` (uuid) - User who created the access link
      
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create weighing_access_links table
CREATE TABLE IF NOT EXISTS weighing_access_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid REFERENCES saved_competitions NOT NULL,
  sectors text[] NOT NULL,
  email text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users NOT NULL
);

-- Enable RLS
ALTER TABLE weighing_access_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create weighing access links"
  ON weighing_access_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their own weighing access links"
  ON weighing_access_links
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete their own weighing access links"
  ON weighing_access_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);