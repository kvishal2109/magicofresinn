-- Product-level size configuration examples
-- Replace product_id values with real IDs from your products table before running.

INSERT INTO size_configurations (product_id, size_id, size_label, dimensions, price_modifier) VALUES
  ('example-product-id-1', 's', 'Small', '20 x 15 inch', 1999),
  ('example-product-id-1', 'l', 'Large', '40 x 20 inch', 2999),
  ('example-product-id-2', 'm', 'Medium', '18 x 18 inch', 1499)
ON CONFLICT (product_id, size_id) DO UPDATE
SET
  size_label = EXCLUDED.size_label,
  dimensions = EXCLUDED.dimensions,
  price_modifier = EXCLUDED.price_modifier;
