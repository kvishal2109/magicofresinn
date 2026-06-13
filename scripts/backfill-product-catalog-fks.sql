-- Backfill product category_id / subcategory_id from text labels.
-- Run in Supabase SQL Editor after creating categories and subcategories in admin.

UPDATE products p
SET category_id = c.id
FROM categories c
WHERE p.category_id IS NULL
  AND lower(trim(p.category)) = lower(trim(c.name));

UPDATE products p
SET subcategory_id = s.id
FROM subcategories s
WHERE p.subcategory_id IS NULL
  AND p.subcategory IS NOT NULL
  AND lower(trim(p.subcategory)) = lower(trim(s.name))
  AND s.category_id = p.category_id;

-- Products that still have null FKs need manual reassignment in Admin → Products.
