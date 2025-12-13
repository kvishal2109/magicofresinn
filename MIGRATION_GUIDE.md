# Product Migration Guide: Blob Storage → Supabase + Cloudinary

This guide explains how to migrate your products from Vercel Blob Storage to Supabase (for data) and Cloudinary (for images).

## Overview

The migration process will:
1. Read all products from Vercel Blob Storage
2. Upload product images to Cloudinary (if not already there)
3. Save products to Supabase with Cloudinary image URLs
4. Preserve product IDs, timestamps, and all metadata

## Prerequisites

Before running the migration, ensure you have:

1. **Supabase configured:**
   - `NEXT_PUBLIC_SUPABASE_URL` environment variable
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variable
   - `SUPABASE_SERVICE_ROLE_KEY` environment variable
   - Products table created (see `lib/supabase/schema.sql`)

2. **Cloudinary configured:**
   - `CLOUDINARY_CLOUD_NAME` environment variable
   - `CLOUDINARY_API_KEY` environment variable
   - `CLOUDINARY_API_SECRET` environment variable

3. **Admin authentication:**
   - Admin password configured in Supabase

## Migration Methods

### Method 1: API Endpoint (Recommended)

Use the admin API endpoint to run the migration:

**Check Migration Status:**
```bash
GET /api/admin/migrate/products
```

**Run Migration:**
```bash
POST /api/admin/migrate/products
Content-Type: application/json

{
  "migrateImages": true,    // Upload images to Cloudinary (default: true)
  "skipExisting": true,     // Skip products that already exist (default: true)
  "batchSize": 10           // Number of products to process at once (default: 10)
}
```

**Example using curl:**
```bash
# First, authenticate and get a session cookie, then:
curl -X POST http://localhost:3000/api/admin/migrate/products \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "migrateImages": true,
    "skipExisting": true,
    "batchSize": 10
  }'
```

**Example using fetch in browser console:**
```javascript
// After logging in as admin
fetch('/api/admin/migrate/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    migrateImages: true,
    skipExisting: true,
    batchSize: 10
  })
})
.then(r => r.json())
.then(console.log);
```

### Method 2: Direct Function Call

You can also call the migration function directly in your code:

```typescript
import { migrateAllProducts } from '@/lib/migration/products';

const result = await migrateAllProducts({
  migrateImages: true,    // Upload images to Cloudinary
  skipExisting: true,     // Skip existing products
  batchSize: 10          // Process 10 products at a time
});

console.log(`Migrated ${result.successful} products`);
console.log(`Failed: ${result.failed}`);
console.log(`Skipped: ${result.skipped}`);
```

## Migration Options

### `migrateImages` (default: `true`)
- If `true`: Downloads images from their current URLs and uploads them to Cloudinary
- If `false`: Keeps existing image URLs (useful if images are already on Cloudinary)
- Images already on Cloudinary are automatically skipped

### `skipExisting` (default: `true`)
- If `true`: Skips products that already exist in Supabase (based on product ID)
- If `false`: Attempts to insert all products (may fail on duplicates)

### `batchSize` (default: `10`)
- Number of products to process in each batch
- Smaller batches = slower but more reliable
- Larger batches = faster but may hit rate limits

## Migration Response

The migration returns a detailed report:

```json
{
  "success": true,
  "message": "Migration completed: 50 successful, 0 failed, 0 skipped",
  "total": 50,
  "successful": 50,
  "failed": 0,
  "skipped": 0,
  "results": [
    {
      "productId": "prod-123",
      "success": true,
      "message": "Successfully migrated product prod-123"
    },
    // ... more results
  ]
}
```

## What Gets Migrated

✅ Product ID (preserved)
✅ Product name, description, price
✅ Original price, discount
✅ Category, subcategory
✅ Stock information
✅ Catalog ID and name
✅ Created and updated timestamps
✅ Product images (uploaded to Cloudinary)
✅ Multiple product images array

## Image Migration Details

- Images are uploaded to Cloudinary folder: `resin-store/products`
- Images already on Cloudinary are detected and skipped
- If image upload fails, the original URL is preserved
- Images are optimized with auto quality and format

## Verification

After migration, verify the results:

1. **Check product count:**
   ```bash
   GET /api/admin/migrate/products
   ```
   Compare `blobStorage.count` vs `supabase.count`

2. **View products in Supabase dashboard:**
   - Go to your Supabase project
   - Navigate to Table Editor → products
   - Verify products are present

3. **Check images in Cloudinary:**
   - Go to your Cloudinary dashboard
   - Navigate to Media Library → resin-store/products
   - Verify images are uploaded

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure all Supabase env vars are set in `.env.local`

### "Missing Cloudinary environment variables"
- Ensure all Cloudinary env vars are set in `.env.local`

### "Failed to fetch image"
- Some image URLs may be broken or inaccessible
- The migration will continue with the original URL
- Check the results array for specific failures

### "Duplicate key error"
- Product already exists in Supabase
- Set `skipExisting: true` to skip duplicates

### Rate Limiting
- Reduce `batchSize` if you hit rate limits
- Add delays between batches (already included)

## Post-Migration

After successful migration:

1. **Test the application:**
   - Verify products load correctly
   - Check that images display properly
   - Test product creation/editing

2. **Optional: Clean up blob storage**
   - Once verified, you can remove products from blob storage
   - Keep a backup before deleting

3. **Update code references:**
   - The app already uses Supabase for reads
   - Admin operations already use Supabase
   - No code changes needed!

## Rollback

If you need to rollback:

1. Products in Supabase can be deleted via admin panel
2. Images in Cloudinary can be deleted via Cloudinary dashboard
3. Original blob storage data remains unchanged

## Support

If you encounter issues:
1. Check the migration results for specific error messages
2. Verify environment variables are set correctly
3. Check Supabase and Cloudinary dashboards for errors
4. Review server logs for detailed error information

