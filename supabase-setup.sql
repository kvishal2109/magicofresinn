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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Insert default admin password (change this!)
INSERT INTO admin_auth (password_hash) 
VALUES ('admin123')
ON CONFLICT DO NOTHING;

