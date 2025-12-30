/*
  # Remove Duplicate Categories Safely

  1. Changes
    - Updates posts to reference the kept category IDs (first occurrence)
    - Removes duplicate category entries that have the same name, icon, and section
    - Keeps the first occurrence of each category (based on ID ordering)
  
  2. Process
    - First, identify which category IDs to keep (first by name+section)
    - Update all posts referencing duplicates to use the kept IDs
    - Delete the duplicate categories
*/

-- Create a temporary table with the mapping of duplicate IDs to kept IDs
CREATE TEMP TABLE category_mapping AS
SELECT 
  c.id as old_id,
  keeper.id as new_id
FROM categories c
INNER JOIN (
  SELECT DISTINCT ON (name, section) id, name, section
  FROM categories
  ORDER BY name, section, id
) keeper ON c.name = keeper.name AND c.section = keeper.section
WHERE c.id != keeper.id;

-- Update posts to reference the kept category IDs
UPDATE posts
SET category_id = cm.new_id
FROM category_mapping cm
WHERE posts.category_id = cm.old_id;

-- Now delete the duplicate categories
DELETE FROM categories
WHERE id IN (SELECT old_id FROM category_mapping);

-- Clean up temp table
DROP TABLE category_mapping;
