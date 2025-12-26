/*
  # Add post expiration function

  ## Changes
  1. Create a function to automatically mark expired posts as inactive
  2. This function can be called periodically or via trigger

  ## Notes
  - Posts with expires_at < now() will be marked as is_active = false
  - This ensures expired posts don't show in listings
*/

-- Create function to expire old posts
CREATE OR REPLACE FUNCTION expire_old_posts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE posts
  SET is_active = false
  WHERE expires_at < now()
    AND is_active = true;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN expired_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION expire_old_posts() TO authenticated;