/*
  # Add country field to profiles

  1. Changes
    - Add country column to profiles table
    - Make country field required
    - Set default value to 'BE' (Belgium)

  2. Notes
    - Uses IF NOT EXISTS to prevent errors if column already exists
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'country'
  ) THEN
    ALTER TABLE profiles ADD COLUMN country text NOT NULL DEFAULT 'BE';
  END IF;
END $$;