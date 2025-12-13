import { Product } from "@/types";
import * as SupabaseProducts from "@/lib/supabase/products";
import { cloudinary } from "@/lib/cloudinary/client";
import { getSupabaseAdmin } from "@/lib/supabase/client";

// Dynamically import blob storage to handle cases where it might not be available
async function getProductsBlob(): Promise<any[]> {
  try {
    const blobStorage = await import("@/lib/blob/storage");
    return await blobStorage.getProductsBlob();
  } catch (error: any) {
    if (error.message?.includes("Can't resolve '@vercel/blob'") || 
        error.message?.includes("Cannot find module")) {
      throw new Error("Blob storage is not available. Please install @vercel/blob package or ensure blob storage is configured.");
    }
    throw error;
  }
}

/**
 * Check if an image URL is already on Cloudinary
 */
function isCloudinaryUrl(url: string): boolean {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
}

/**
 * Upload an image from a URL to Cloudinary
 */
async function uploadImageFromUrl(
  imageUrl: string,
  productId: string,
  imageIndex: number = 0
): Promise<string> {
  try {
    // If already on Cloudinary, return as-is
    if (isCloudinaryUrl(imageUrl)) {
      console.log(`Image ${imageUrl} is already on Cloudinary, skipping upload`);
      return imageUrl;
    }

    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName = `product-${productId}-${imageIndex}-${Date.now()}`;

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `resin-store/products`,
            public_id: fileName,
            resource_type: 'image',
            transformation: [
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    console.log(`Uploaded image ${imageUrl} to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`Error uploading image ${imageUrl} to Cloudinary:`, error);
    // Return original URL if upload fails
    return imageUrl;
  }
}

/**
 * Migrate product images to Cloudinary
 */
async function migrateProductImages(product: Product): Promise<{
  image: string;
  images: string[];
}> {
  const migratedImage = await uploadImageFromUrl(product.image, product.id, 0);
  
  const migratedImages: string[] = [];
  if (product.images && product.images.length > 0) {
    for (let i = 0; i < product.images.length; i++) {
      const migrated = await uploadImageFromUrl(product.images[i], product.id, i + 1);
      migratedImages.push(migrated);
    }
  }

  return {
    image: migratedImage,
    images: migratedImages,
  };
}

/**
 * Check if a product already exists in Supabase
 */
async function productExistsInSupabase(productId: string): Promise<boolean> {
  try {
    const existing = await SupabaseProducts.getProductById(productId);
    return existing !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Migrate a single product from blob storage to Supabase
 */
export async function migrateProduct(
  product: Product,
  options: {
    migrateImages: boolean;
    skipExisting: boolean;
  } = { migrateImages: true, skipExisting: true }
): Promise<{ success: boolean; productId: string; message: string }> {
  try {
    // Check if product already exists
    if (options.skipExisting) {
      const exists = await productExistsInSupabase(product.id);
      if (exists) {
        return {
          success: true,
          productId: product.id,
          message: `Product ${product.id} already exists in Supabase, skipping`,
        };
      }
    }

    // Migrate images if requested
    let image = product.image;
    let images = product.images || [];
    
    if (options.migrateImages) {
      const migrated = await migrateProductImages(product);
      image = migrated.image;
      images = migrated.images;
    }

    // Prepare product data for Supabase
    const productData: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      discount: product.discount,
      image,
      images,
      category: product.category,
      subcategory: product.subcategory,
      inStock: product.inStock ?? true,
      stock: product.stock,
      catalogId: product.catalogId,
      catalogName: product.catalogName,
    };

    // Create product in Supabase (we'll use a custom function to preserve the ID)
    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase
      .from('products')
      .insert({
        id: product.id,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        original_price: productData.originalPrice || null,
        discount: productData.discount || null,
        image: productData.image,
        images: productData.images || [],
        category: productData.category,
        subcategory: productData.subcategory || null,
        in_stock: productData.inStock ?? true,
        stock: productData.stock || null,
        catalog_id: productData.catalogId || null,
        catalog_name: productData.catalogName || null,
        created_at: product.createdAt instanceof Date 
          ? product.createdAt.toISOString() 
          : new Date(product.createdAt).toISOString(),
        updated_at: product.updatedAt instanceof Date 
          ? product.updatedAt.toISOString() 
          : new Date(product.updatedAt).toISOString(),
      });

    if (error) {
      // If it's a duplicate key error, the product already exists
      if (error.code === '23505') {
        return {
          success: true,
          productId: product.id,
          message: `Product ${product.id} already exists in Supabase`,
        };
      }
      throw error;
    }

    return {
      success: true,
      productId: product.id,
      message: `Successfully migrated product ${product.id}`,
    };
  } catch (error: any) {
    console.error(`Error migrating product ${product.id}:`, error);
    return {
      success: false,
      productId: product.id,
      message: `Failed to migrate product ${product.id}: ${error.message}`,
    };
  }
}

/**
 * Migrate all products from blob storage to Supabase
 */
export async function migrateAllProducts(options: {
  migrateImages: boolean;
  skipExisting: boolean;
  batchSize?: number;
} = { migrateImages: true, skipExisting: true, batchSize: 10 }): Promise<{
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  results: Array<{ productId: string; success: boolean; message: string }>;
}> {
  try {
    // Get all products from blob storage
    let blobProducts: any[];
    try {
      blobProducts = await getProductsBlob();
    } catch (error: any) {
      if (error.message?.includes("Can't resolve '@vercel/blob'") || 
          error.message?.includes("Cannot find module") ||
          error.message?.includes("not available")) {
        throw new Error("Blob storage is not available. Please ensure @vercel/blob is installed and BLOB_READ_WRITE_TOKEN is configured in your environment variables.");
      }
      throw error;
    }
    
    if (!blobProducts || blobProducts.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        results: [],
      };
    }

    // Convert to Product format
    const products: Product[] = blobProducts.map((p: any) => ({
      ...p,
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    }));

    const results: Array<{ productId: string; success: boolean; message: string }> = [];
    let successful = 0;
    let failed = 0;
    let skipped = 0;

    // Process products in batches
    const batchSize = options.batchSize || 10;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(product => migrateProduct(product, options))
      );

      for (const result of batchResults) {
        results.push(result);
        if (result.success) {
          if (result.message.includes('already exists') || result.message.includes('skipping')) {
            skipped++;
          } else {
            successful++;
          }
        } else {
          failed++;
        }
      }

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < products.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      total: products.length,
      successful,
      failed,
      skipped,
      results,
    };
  } catch (error: any) {
    console.error('Error migrating products:', error);
    throw error;
  }
}

