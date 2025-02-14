/*
  # Competition data storage schema

  1. New Tables
    - `saved_competitions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `date` (date)
      - `location` (text)
      - `type` (text)
      - `criterium_folder_id` (uuid, nullable)
      - `participants` (jsonb)
      - `sector_sizes` (integer[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `criterium_folders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `type` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create saved_competitions table
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

-- Create criterium_folders table
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

-- Policies for saved_competitions
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

-- Policies for criterium_folders
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