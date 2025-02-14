-- Drop existing foreign key if it exists
ALTER TABLE calendar_events
DROP CONSTRAINT IF EXISTS calendar_events_user_id_fkey;

-- Add foreign key constraint to establish relationship
ALTER TABLE calendar_events
ADD CONSTRAINT calendar_events_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Add foreign key constraint to link calendar_events to club_details
ALTER TABLE calendar_events
ADD CONSTRAINT calendar_events_club_details_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id);