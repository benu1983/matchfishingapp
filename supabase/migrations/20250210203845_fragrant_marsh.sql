/*
  # Database setup for fishing competition app
  
  1. Tables
    - saved_competitions: Stores competition data with user association
    - criterium_folders: Stores criterium folder data with user association
  
  2. Security
    - Enable RLS on both tables
    - Add policies for CRUD operations
*/

-- Create saved_competitions table if it doesn't exist
CREATE TABLE IF NOT EXISTS saved_competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  date date NOT NULL,
  location text NOT NULL,
  type text NOT NULL,
  criterium_folder_id uuid,
  participants jsonb NOT NULL,
  sector_sizes integer[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create criterium_folders table if it doesn't exist
CREATE TABLE IF NOT EXISTS criterium_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE saved_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE criterium_folders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Drop saved_competitions policies
    DROP POLICY IF EXISTS "Users can create their own competitions" ON saved_competitions;
    DROP POLICY IF EXISTS "Users can view their own competitions" ON saved_competitions;
    DROP POLICY IF EXISTS "Users can update their own competitions" ON saved_competitions;
    DROP POLICY IF EXISTS "Users can delete their own competitions" ON saved_competitions;
    
    -- Drop criterium_folders policies
    DROP POLICY IF EXISTS "Users can create their own folders" ON criterium_folders;
    DROP POLICY IF EXISTS "Users can view their own folders" ON criterium_folders;
    DROP POLICY IF EXISTS "Users can update their own folders" ON criterium_folders;
    DROP POLICY IF EXISTS "Users can delete their own folders" ON criterium_folders;
END $$;

-- Create policies for saved_competitions
CREATE POLICY "Users can create their own competitions"
  ON saved_competitions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own competitions"
  ON saved_competitions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

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

-- Create policies for criterium_folders
CREATE POLICY "Users can create their own folders"
  ON criterium_folders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own folders"
  ON criterium_folders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON criterium_folders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON criterium_folders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);