/*
  # Add RLS Policies for Posts Table

  ## Security Changes
  Posts table currently has RLS enabled but no policies, which locks down all access.
  
  ## New Policies
  1. **Public Read Access**
     - Anyone can view active posts that haven't expired
     - Essential for anonymous users browsing listings
  
  2. **Authenticated User Insert**
     - Only authenticated users (including anonymous) can create posts
     - Prevents unauthorized post creation
  
  3. **Owner Update Access**
     - Users can only update their own posts
     - Allows editing and renewal of owned listings
  
  4. **Owner Delete Access**
     - Users can only delete/deactivate their own posts
     - Soft delete by setting is_active = false
  
  ## Important Notes
  - All policies check authentication and ownership where applicable
  - Anonymous users can create posts (they get anonymous auth sessions)
  - Public can view active, non-expired posts for browsing
*/

-- Allow anyone to view active posts
CREATE POLICY "Anyone can view active posts"
  ON posts FOR SELECT
  USING (is_active = true AND expires_at > now());

-- Allow authenticated users (including anonymous) to create posts
CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own posts
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete (soft-delete) their own posts
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
