-- Add new fields to club_details table
DO $$ 
BEGIN
  -- Add website field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'club_details' AND column_name = 'website'
  ) THEN
    ALTER TABLE club_details ADD COLUMN website text;
  END IF;

  -- Add email field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'club_details' AND column_name = 'email'
  ) THEN
    ALTER TABLE club_details ADD COLUMN email text;
  END IF;

  -- Add visibility toggle fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'club_details' AND column_name = 'public_name'
  ) THEN
    ALTER TABLE club_details ADD COLUMN public_name boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'club_details' AND column_name = 'public_address'
  ) THEN
    ALTER TABLE club_details ADD COLUMN public_address boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'club_details' AND column_name = 'public_phone'
  ) THEN
    ALTER TABLE club_details ADD COLUMN public_phone boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'club_details' AND column_name = 'public_rules'
  ) THEN
    ALTER TABLE club_details ADD COLUMN public_rules boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'club_details' AND column_name = 'public_website'
  ) THEN
    ALTER TABLE club_details ADD COLUMN public_website boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'club_details' AND column_name = 'public_email'
  ) THEN
    ALTER TABLE club_details ADD COLUMN public_email boolean NOT NULL DEFAULT false;
  END IF;
END $$;