/*
  # Enable Realtime for posts table

  ## Changes
  1. Enable realtime replication for the posts table
  2. This allows clients to subscribe to database changes in real-time

  ## Notes
  - Changes (insert/update/delete) will broadcast to all subscribed clients
  - Ensures instant updates without page reload
*/

-- Enable realtime for posts table
ALTER PUBLICATION supabase_realtime ADD TABLE posts;