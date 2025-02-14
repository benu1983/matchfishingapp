-- Drop existing foreign key if it exists
ALTER TABLE calendar_events
DROP CONSTRAINT IF EXISTS calendar_events_club_details_fkey;

-- Create a view that joins calendar_events with club_details
CREATE OR REPLACE VIEW public_calendar_events AS
SELECT 
  ce.*,
  cd.name as club_name,
  cd.street as club_street,
  cd.postal_code as club_postal_code,
  cd.city as club_city,
  cd.country as club_country,
  cd.phone_numbers as club_phone_numbers,
  cd.website as club_website,
  cd.email as club_email,
  cd.public_name as club_public_name,
  cd.public_address as club_public_address,
  cd.public_phone as club_public_phone,
  cd.public_website as club_public_website,
  cd.public_email as club_public_email,
  cd.public_social_media as club_public_social_media,
  cd.social_media as club_social_media
FROM calendar_events ce
LEFT JOIN club_details cd ON ce.user_id = cd.user_id
WHERE ce.access = 'public';

-- Enable RLS on the view
ALTER VIEW public_calendar_events OWNER TO authenticated;
GRANT SELECT ON public_calendar_events TO anon;
GRANT SELECT ON public_calendar_events TO authenticated;