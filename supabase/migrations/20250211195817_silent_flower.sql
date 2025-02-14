/*
  # Add import and edit status columns to calendar_events

  1. Changes
    - Add is_imported boolean column with default false
    - Add is_edited boolean column with default false
*/

-- Add is_imported and is_edited columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'is_imported'
  ) THEN
    ALTER TABLE calendar_events 
      ADD COLUMN is_imported boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'is_edited'
  ) THEN
    ALTER TABLE calendar_events 
      ADD COLUMN is_edited boolean NOT NULL DEFAULT false;
  END IF;
END $$;