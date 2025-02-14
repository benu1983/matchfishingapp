-- Add social media fields to club_details table
ALTER TABLE club_details
ADD COLUMN social_media jsonb NOT NULL DEFAULT '[]',
ADD COLUMN public_social_media boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN club_details.social_media IS 'Array of social media links with platform and URL';