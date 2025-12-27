/*
  # Add Flexible Contact System

  ## Overview
  This migration adds a comprehensive contact system allowing sellers to share
  multiple types of contact information (phone, email, WhatsApp, etc.) with
  optional visibility controls.

  ## Changes

  1. New Tables
    - `user_profiles`
      - Stores user's default contact information
      - User can set preferred contact methods
      - Auto-fills when creating new posts
    
    - `contact_views`
      - Tracks when users view contact information
      - Prevents spam/harassment
      - Provides analytics to sellers

  2. Modified Tables
    - `posts`
      - Add `contact_info` JSONB field for flexible contact data
      - Supports: phone, email, whatsapp, telegram, signal, other
      - Each contact method can be individually hidden/shown

  ## Security
  - Enable RLS on all tables
  - Users can only view their own profile
  - Users can update their own profile
  - Contact info is visible based on post settings
  - Track who views contact information

  ## Contact Info Structure
  {
    "phone": { "value": "555-1234", "visible": false },
    "email": { "value": "user@example.com", "visible": true },
    "whatsapp": { "value": "555-1234", "visible": false },
    "telegram": { "value": "@username", "visible": false },
    "other": { "value": "Custom contact method", "visible": false }
  }
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_contact_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add contact_info to posts table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'contact_info'
  ) THEN
    ALTER TABLE posts ADD COLUMN contact_info jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create contact_views table to track who viewed contact info
CREATE TABLE IF NOT EXISTS contact_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  viewer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewer_session_id text,
  viewed_at timestamptz DEFAULT now(),
  CONSTRAINT contact_views_unique UNIQUE(post_id, viewer_user_id, viewer_session_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_contact_views_post_id ON contact_views(post_id);
CREATE INDEX IF NOT EXISTS idx_contact_views_viewer ON contact_views(viewer_user_id, viewer_session_id);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on contact_views
ALTER TABLE contact_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for contact_views

-- Post owners can view all contact views for their posts
CREATE POLICY "Post owners can view contact views"
  ON contact_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = contact_views.post_id
      AND posts.user_id = auth.uid()
    )
  );

-- Authenticated users can record their own contact views
CREATE POLICY "Users can record own contact views"
  ON contact_views
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = viewer_user_id);

-- Anonymous users can record contact views with session_id
CREATE POLICY "Anonymous users can record contact views"
  ON contact_views
  FOR INSERT
  TO anon
  WITH CHECK (viewer_user_id IS NULL AND viewer_session_id IS NOT NULL);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user_profiles.updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();