-- ============================================
-- SUPABASE DATABASE SETUP
-- ============================================
-- Copy and paste this entire file into Supabase SQL Editor
-- Then click "Run" or press Ctrl+Enter

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  discount DECIMAL(5,2),
  image TEXT,
  images TEXT[],
  category TEXT NOT NULL,
  subcategory TEXT,
  in_stock BOOLEAN DEFAULT true,
  stock INTEGER,
  catalog_id TEXT,
  catalog_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Size configurations table (product-level size charts)
CREATE TABLE IF NOT EXISTS size_configurations (
  id SERIAL PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_id TEXT NOT NULL,
  size_label TEXT NOT NULL,
  dimensions TEXT NOT NULL,
  price_modifier DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, size_id)
);

-- Backward-compatible migration if you already created the old table shape
ALTER TABLE size_configurations
  ADD COLUMN IF NOT EXISTS product_id TEXT;

ALTER TABLE size_configurations
  ADD COLUMN IF NOT EXISTS size_id TEXT;

ALTER TABLE size_configurations
  ADD COLUMN IF NOT EXISTS size_label TEXT;

ALTER TABLE size_configurations
  ADD COLUMN IF NOT EXISTS dimensions TEXT;

ALTER TABLE size_configurations
  ADD COLUMN IF NOT EXISTS price_modifier DECIMAL(10,2) DEFAULT 0;

ALTER TABLE size_configurations
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE size_configurations
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'size_configurations'
      AND column_name = 'category_name'
  ) THEN
    EXECUTE '
      UPDATE size_configurations
      SET product_id = category_name
      WHERE product_id IS NULL
    ';
    ALTER TABLE size_configurations DROP CONSTRAINT IF EXISTS size_configurations_category_name_size_id_key;
  END IF;

  ALTER TABLE size_configurations DROP CONSTRAINT IF EXISTS size_configurations_product_id_size_id_key;
  ALTER TABLE size_configurations
    ADD CONSTRAINT size_configurations_product_id_size_id_key UNIQUE (product_id, size_id);

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'size_configurations'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'size_configurations_product_id_fkey'
  ) THEN
    ALTER TABLE size_configurations
      ADD CONSTRAINT size_configurations_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  coupon_code TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  order_status TEXT DEFAULT 'pending',
  payment_id TEXT,
  utr_number TEXT,
  payment_proof_url TEXT,
  payment_submitted_at TIMESTAMP,
  verified_amount DECIMAL(10,2),
  verified_at TIMESTAMP,
  verified_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories metadata table
CREATE TABLE IF NOT EXISTS categories_metadata (
  id SERIAL PRIMARY KEY,
  category_name TEXT NOT NULL,
  subcategory_name TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(category_name, subcategory_name)
);

-- Admin password table
CREATE TABLE IF NOT EXISTS admin_auth (
  id SERIAL PRIMARY KEY,
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Coupons table (admin-managed discount codes)
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2),
  max_discount DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_size_configurations_product_id ON size_configurations(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- Optional: seed default coupons (run if you want to manage them from the admin panel)
INSERT INTO coupons (id, code, discount_type, discount_value, min_purchase, max_discount, is_active) VALUES
  ('c_welcome10', 'WELCOME10', 'percentage', 10, 500, 200, true),
  ('c_save20', 'SAVE20', 'percentage', 20, 1000, 500, true),
  ('c_flat100', 'FLAT100', 'fixed', 100, 500, NULL, true),
  ('c_flat500', 'FLAT500', 'fixed', 500, 2000, NULL, true),
  ('c_newuser', 'NEWUSER', 'percentage', 15, 0, 300, true)
ON CONFLICT (code) DO NOTHING;

-- Insert default admin password (change this!)
INSERT INTO admin_auth (password_hash) 
VALUES ('admin123')
ON CONFLICT DO NOTHING;

