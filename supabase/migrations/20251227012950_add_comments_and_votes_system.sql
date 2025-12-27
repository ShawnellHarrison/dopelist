/*
  # Add Comments and Votes System for All-Mighty DopeList

  1. Updates to `posts` Table
    - Add `stripe_session_id` (text) - Tracks the Stripe checkout session to prevent reuse
    - Add `comments_close_at` (timestamptz) - Timestamp when comments close (24 hours after creation)
    
  2. New `comments` Table
    - `id` (uuid, primary key)
    - `post_id` (uuid, foreign key to posts)
    - `user_id` (uuid, foreign key to auth.users, nullable for anonymous)
    - `text` (text) - The comment content
    - `created_at` (timestamptz)
    - Includes composite index on (post_id, created_at)
    
  3. New `post_votes` Table
    - `id` (uuid, primary key)
    - `post_id` (uuid, foreign key to posts)
    - `user_id` (uuid, nullable for anonymous)
    - `session_id` (text) - For tracking anonymous votes
    - `vote_value` (integer) - 1 for upvote, -1 for downvote
    - `created_at` (timestamptz)
    - Unique constraint on (post_id, user_id) for authenticated users
    - Unique constraint on (post_id, session_id) for anonymous users
    
  4. Security
    - Enable RLS on all new tables
    - Comments: Anyone can read, authenticated/anonymous can create if comments are open
    - Votes: Anyone can read, one vote per user/session per post
    
  5. Important Notes
    - Comments close automatically 24 hours after post creation
    - Votes are tracked individually but aggregated in posts.votes
    - Anonymous users tracked by session_id
    - stripe_session_id prevents payment reuse
*/

-- Add new columns to posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE posts ADD COLUMN stripe_session_id text UNIQUE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'comments_close_at'
  ) THEN
    ALTER TABLE posts ADD COLUMN comments_close_at timestamptz;
  END IF;
END $$;

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for efficient comment loading
CREATE INDEX IF NOT EXISTS idx_comments_post_created 
  ON comments(post_id, created_at DESC);

-- Create post_votes table
CREATE TABLE IF NOT EXISTS post_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  vote_value integer NOT NULL CHECK (vote_value IN (-1, 1)),
  created_at timestamptz DEFAULT now()
);

-- Create indexes and constraints for votes
CREATE INDEX IF NOT EXISTS idx_votes_post ON post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON post_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_session ON post_votes(session_id);

-- Unique constraint: one vote per authenticated user per post
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_unique_user 
  ON post_votes(post_id, user_id) 
  WHERE user_id IS NOT NULL;

-- Unique constraint: one vote per anonymous session per post
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_unique_session 
  ON post_votes(post_id, session_id) 
  WHERE session_id IS NOT NULL AND user_id IS NULL;

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;

-- Comments policies: Anyone can read
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO public
  USING (true);

-- Comments policies: Create only if comments are open (within 24 hours)
CREATE POLICY "Users can create comments if open"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = comments.post_id 
      AND posts.comments_close_at > now()
      AND posts.is_active = true
    )
  );

-- Votes policies: Anyone can read
CREATE POLICY "Anyone can view votes"
  ON post_votes FOR SELECT
  TO public
  USING (true);

-- Votes policies: Authenticated users can vote
CREATE POLICY "Authenticated users can vote"
  ON post_votes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_votes.post_id 
      AND posts.is_active = true
    )
  );

-- Votes policies: Users can update their own votes
CREATE POLICY "Users can update own votes"
  ON post_votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Votes policies: Users can delete their own votes
CREATE POLICY "Users can delete own votes"
  ON post_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to automatically update post vote count
CREATE OR REPLACE FUNCTION update_post_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts 
  SET votes = (
    SELECT COALESCE(SUM(vote_value), 0) 
    FROM post_votes 
    WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
  )
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update vote count on insert/update/delete
DROP TRIGGER IF EXISTS trigger_update_post_votes ON post_votes;
CREATE TRIGGER trigger_update_post_votes
  AFTER INSERT OR UPDATE OR DELETE ON post_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_vote_count();

-- Function to set comments_close_at when post is created
CREATE OR REPLACE FUNCTION set_comments_close_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.comments_close_at IS NULL THEN
    NEW.comments_close_at := NEW.created_at + interval '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set comments_close_at
DROP TRIGGER IF EXISTS trigger_set_comments_close_at ON posts;
CREATE TRIGGER trigger_set_comments_close_at
  BEFORE INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION set_comments_close_at();