-- Add user_id column to calendar_events
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE calendar_events 
      ADD COLUMN user_id uuid REFERENCES auth.users(id);

    -- Update existing records to use the creator's user_id
    UPDATE calendar_events
    SET user_id = created_by
    WHERE user_id IS NULL;

    -- Make user_id required for future records
    ALTER TABLE calendar_events
      ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;