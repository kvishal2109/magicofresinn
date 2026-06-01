-- Purge legacy static catalog categories from Supabase.
-- Run in Supabase SQL Editor if the admin API is unavailable.

DELETE FROM products
WHERE lower(trim(category)) IN (
  'wedding',
  'jewellery',
  'home decor',
  'furniture'
);

-- After running catalog migration (Admin → Categories → Migrate Legacy Data),
-- you may drop the legacy table:
-- DROP TABLE IF EXISTS categories_metadata;
