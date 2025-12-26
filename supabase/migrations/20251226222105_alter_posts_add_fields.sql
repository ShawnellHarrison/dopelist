/*
  # Alter posts table to add missing fields

  ## Changes
  1. Add `location` text field for neighborhood/area within city
  2. Add `images` text array for storing image URLs
  3. Add `reactions` jsonb for reaction counts
  4. Add `is_active` boolean to mark posts as live/expired
  5. Make `price` nullable (some posts may not have prices)
  6. Add indexes for better query performance

  ## Notes
  - All new columns have safe defaults
  - Existing data remains unchanged
  - Indexes improve filtering and sorting performance
*/

-- Add location field if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'location'
  ) THEN
    ALTER TABLE posts ADD COLUMN location text DEFAULT '';
  END IF;
END $$;

-- Add images array if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'images'
  ) THEN
    ALTER TABLE posts ADD COLUMN images text[] DEFAULT '{}';
  END IF;
END $$;

-- Add reactions jsonb if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'reactions'
  ) THEN
    ALTER TABLE posts ADD COLUMN reactions jsonb DEFAULT '{"hot": 0, "interested": 0, "watching": 0, "question": 0, "deal": 0}';
  END IF;
END $$;

-- Add is_active boolean if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE posts ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Make price nullable
DO $$
BEGIN
  ALTER TABLE posts ALTER COLUMN price DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Update existing NULL locations to empty string
UPDATE posts SET location = '' WHERE location IS NULL;

-- Make location NOT NULL after setting defaults
DO $$
BEGIN
  ALTER TABLE posts ALTER COLUMN location SET NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create additional indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_votes ON posts(votes DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_active_expires ON posts(is_active, expires_at DESC);