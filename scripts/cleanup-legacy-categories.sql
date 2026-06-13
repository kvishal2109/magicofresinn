-- Remove legacy categories_metadata table (replaced by categories / subcategories).
-- Run in Supabase SQL Editor.

DROP TABLE IF EXISTS categories_metadata CASCADE;
