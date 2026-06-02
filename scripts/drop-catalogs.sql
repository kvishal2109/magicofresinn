-- Remove PDF catalogs feature from an existing Supabase project.
-- Run in Supabase SQL Editor after deploying the code update.

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_catalog_id_fkey;
ALTER TABLE categories DROP COLUMN IF EXISTS catalog_id;

ALTER TABLE products DROP COLUMN IF EXISTS catalog_id;
ALTER TABLE products DROP COLUMN IF EXISTS catalog_name;

DROP TABLE IF EXISTS catalogs CASCADE;

DROP INDEX IF EXISTS idx_categories_catalog_slug;
DROP INDEX IF EXISTS idx_categories_global_slug;

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
