-- Add social media fields to club_details table
DO $$ 
BEGIN
  -- Add social_media column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'club_details' AND column_name = 'social_media'
  ) THEN
    ALTER TABLE club_details 
      ADD COLUMN social_media jsonb NOT NULL DEFAULT '[]';
  END IF;

  -- Add public_social_media column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'club_details' AND column_name = 'public_social_media'
  ) THEN
    ALTER TABLE club_details 
      ADD COLUMN public_social_media boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add comment to explain the social_media column structure
COMMENT ON COLUMN club_details.social_media IS 'Array of social media links with platform and URL';