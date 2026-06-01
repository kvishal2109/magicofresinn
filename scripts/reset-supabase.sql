-- ============================================
-- RESET SUPABASE — wipes all app tables & data
-- ============================================
-- WARNING: This permanently deletes ALL data (products, orders, categories, etc.)
-- Run in Supabase SQL Editor, then run scripts/fresh-setup.sql

-- Drop tables in dependency order (children first)
DROP TABLE IF EXISTS size_configurations CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS catalogs CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS categories_metadata CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS admin_auth CASCADE;

-- Optional: clear uploaded files in storage (uncomment if you want empty storage too)
-- DELETE FROM storage.objects WHERE bucket_id = 'store-images';
