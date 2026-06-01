-- Purge legacy static catalog categories from Supabase.
-- Run in Supabase SQL Editor if the admin API is unavailable.

DELETE FROM products
WHERE lower(trim(category)) IN (
  'wedding',
  'jewellery',
  'home decor',
  'furniture'
);

DELETE FROM categories_metadata
WHERE lower(trim(category_name)) IN (
  'wedding',
  'jewellery',
  'home decor',
  'furniture'
);
