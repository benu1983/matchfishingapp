/*
  # Update calendar and storage schema

  1. Changes
    - Add format field to calendar_events
    - Add location fields to calendar_events
    - Create storage buckets for files
    - Add storage policies

  2. Security
    - Enable RLS for storage objects
    - Add policies for file access
*/

-- Add format field to calendar_events
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'format'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN format text NOT NULL DEFAULT 'single'
      CHECK (format IN ('single', 'pair', 'trio'));
  END IF;
END $$;

-- Add location fields to calendar_events
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN postal_code text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'city'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN city text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'country'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN country text NOT NULL DEFAULT 'BE';
  END IF;
END $$;

-- Create storage buckets for files if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('club-files', 'club-files', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-files', 'event-files', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload club files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own club files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own club files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read club files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload event files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own event files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own event files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read event files" ON storage.objects;

-- Create storage policies for club-files bucket
CREATE POLICY "Users can upload club files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'club-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own club files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'club-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own club files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'club-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can read club files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'club-files');

-- Create storage policies for event-files bucket
CREATE POLICY "Users can upload event files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'event-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own event files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'event-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own event files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'event-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can read event files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'event-files');