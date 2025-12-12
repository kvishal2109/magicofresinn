import { put, del, list } from "@vercel/blob";

const BLOB_STORE_PREFIX = "store-data";

// Products storage
const PRODUCTS_BLOB_PATH = `${BLOB_STORE_PREFIX}/products.json`;
// Orders storage  
const ORDERS_BLOB_PATH = `${BLOB_STORE_PREFIX}/orders.json`;
// Categories metadata storage
const CATEGORIES_METADATA_BLOB_PATH = `${BLOB_STORE_PREFIX}/categories-metadata.json`;
// Admin password storage
const ADMIN_PASSWORD_BLOB_PATH = `${BLOB_STORE_PREFIX}/admin-password.json`;

// ========== IN-MEMORY CACHE ==========
// Cache to reduce API calls
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  url?: string;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

function getCachedData<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCachedData<T>(key: string, data: T, url?: string): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    url,
  });
}

function invalidateCache(key: string): void {
  cache.delete(key);
}

// ========== BLOB URL CACHE ==========
// Cache blob URLs to avoid repeated list() calls
const blobUrlCache = new Map<string, { url: string; timestamp: number }>();
const BLOB_URL_CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getCachedBlobUrl(path: string): Promise<string | null> {
  const cached = blobUrlCache.get(path);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > BLOB_URL_CACHE_TTL) {
    blobUrlCache.delete(path);
    return null;
  }
  
  return cached.url;
}

async function getBlobUrl(path: string): Promise<string | null> {
  // Check URL cache first
  const cachedUrl = await getCachedBlobUrl(path);
  if (cachedUrl) {
    return cachedUrl;
  }
  
  // Fetch from blob API
  try {
    const { blobs } = await list({ prefix: path });
    if (blobs.length === 0) return null;
    
    const url = blobs[0].url;
    // Cache the URL
    blobUrlCache.set(path, { url, timestamp: Date.now() });
    return url;
  } catch (error) {
    console.error(`Error getting blob URL for ${path}:`, error);
    return null;
  }
}

/**
 * Products Storage Functions
 */
export async function getProductsBlob(): Promise<any[]> {
  // Check cache first
  const cached = getCachedData<any[]>('products');
  if (cached) {
    return cached;
  }
  
  try {
    // Get blob URL (with URL caching)
    const blobUrl = await getBlobUrl(PRODUCTS_BLOB_PATH);
    
    if (!blobUrl) {
      return [];
    }
    
    // Fetch the JSON data from the blob URL
    const response = await fetch(blobUrl, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    
    if (!response.ok) {
      if (response.status === 404 || response.status === 403) {
        console.warn("Blob store unavailable (forbidden or not found), returning empty array");
        return [];
      }
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    
    const data = await response.json();
    const products = Array.isArray(data) ? data : [];
    
    // Cache the result
    setCachedData('products', products, blobUrl);
    
    return products;
  } catch (error: any) {
    if (error.status === 404 || 
        error.status === 403 ||
        error.message?.includes("not found") || 
        error.message?.includes("suspended") ||
        error.message?.includes("Forbidden") ||
        error.message?.includes("forbidden")) {
      console.warn("Blob store unavailable (suspended, forbidden, or not found), returning empty array");
      return [];
    }
    console.error("Error reading products from blob:", error);
    return [];
  }
}

export async function saveProductsBlob(products: any[]): Promise<void> {
  try {
    const jsonData = JSON.stringify(products, null, 2);
    await put(PRODUCTS_BLOB_PATH, jsonData, {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    });
    
    // Invalidate cache after save
    invalidateCache('products');
    blobUrlCache.delete(PRODUCTS_BLOB_PATH);
  } catch (error: any) {
    if (error.message?.includes("suspended")) {
      console.warn("Blob store is suspended. Cannot save products. Changes will not persist.");
      throw new Error("Vercel Blob store is suspended. Please contact support to restore access.");
    }
    console.error("Error saving products to blob:", error);
    throw error;
  }
}

/**
 * Orders Storage Functions
 */
export async function getOrdersBlob(): Promise<any[]> {
  // Check cache first
  const cached = getCachedData<any[]>('orders');
  if (cached) {
    return cached;
  }
  
  try {
    // Get blob URL (with URL caching)
    const blobUrl = await getBlobUrl(ORDERS_BLOB_PATH);
    
    if (!blobUrl) {
      return [];
    }
    
    // Fetch the JSON data from the blob URL
    const response = await fetch(blobUrl, {
      next: { revalidate: 60 }, // Cache for 1 minute (orders change more frequently)
    });
    
    if (!response.ok) {
      if (response.status === 404 || response.status === 403) {
        console.warn("Blob store unavailable (forbidden or not found), returning empty array");
        return [];
      }
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }
    
    const data = await response.json();
    const orders = Array.isArray(data) ? data : [];
    
    // Cache the result
    setCachedData('orders', orders, blobUrl);
    
    return orders;
  } catch (error: any) {
    if (error.status === 404 || 
        error.status === 403 ||
        error.message?.includes("not found") || 
        error.message?.includes("suspended") ||
        error.message?.includes("Forbidden") ||
        error.message?.includes("forbidden")) {
      console.warn("Blob store unavailable (suspended, forbidden, or not found), returning empty array");
      return [];
    }
    console.error("Error reading orders from blob:", error);
    return [];
  }
}

export async function saveOrdersBlob(orders: any[]): Promise<void> {
  try {
    const jsonData = JSON.stringify(orders, null, 2);
    await put(ORDERS_BLOB_PATH, jsonData, {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    });
    
    // Invalidate cache after save
    invalidateCache('orders');
    blobUrlCache.delete(ORDERS_BLOB_PATH);
  } catch (error: any) {
    if (error.message?.includes("suspended")) {
      console.warn("Blob store is suspended. Cannot save orders. Changes will not persist.");
      throw new Error("Vercel Blob store is suspended. Please contact support to restore access.");
    }
    console.error("Error saving orders to blob:", error);
    throw error;
  }
}

/**
 * Image Upload - Generate upload URL for client-side upload
 * Returns a URL that the client can POST to directly
 */
export async function generateImageUploadUrl(
  fileName: string,
  folder: string = "products"
): Promise<{ url: string; path: string }> {
  try {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = fileName.split(".").pop() || "jpg";
    const blobPath = `${BLOB_STORE_PREFIX}/${folder}/${timestamp}-${randomString}.${fileExtension}`;
    
    // Create a temporary blob to get the upload URL
    // The client will upload directly to this URL
    const { url } = await put(blobPath, new Blob(), {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: false,
    });
    
    return { url, path: blobPath };
  } catch (error) {
    console.error("Error generating upload URL:", error);
    throw error;
  }
}

/**
 * Delete image from blob storage
 */
export async function deleteImageBlob(blobUrl: string): Promise<void> {
  try {
    // Extract blob path from URL
    const url = new URL(blobUrl);
    const pathMatch = url.pathname.match(/\/([^?]+)/);
    if (pathMatch) {
      const blobPath = pathMatch[1];
      await del(blobPath);
    }
  } catch (error) {
    console.error("Error deleting image from blob:", error);
    // Don't throw - image deletion is not critical
  }
}

/**
 * List all images in a folder (for cleanup/admin)
 */
export async function listImagesBlob(folder: string = "products"): Promise<string[]> {
  try {
    const prefix = `${BLOB_STORE_PREFIX}/${folder}/`;
    const { blobs } = await list({ prefix });
    return blobs.map((blob) => blob.url);
  } catch (error) {
    console.error("Error listing images:", error);
    return [];
  }
}

/**
 * Categories Metadata Storage Functions
 */
interface CategoryMetadata {
  name: string;
  image?: string;
}

interface SubcategoryMetadata {
  categoryName: string;
  subcategoryName: string;
  image?: string;
}

export interface CategoriesMetadata {
  categories: Record<string, CategoryMetadata>;
  subcategories: Record<string, SubcategoryMetadata>;
}

export async function getCategoriesMetadata(): Promise<CategoriesMetadata> {
  // Check cache first
  const cached = getCachedData<CategoriesMetadata>('categories-metadata');
  if (cached) {
    return cached;
  }
  
  try {
    // Get blob URL (with URL caching)
    const blobUrl = await getBlobUrl(CATEGORIES_METADATA_BLOB_PATH);
    
    if (!blobUrl) {
      return { categories: {}, subcategories: {} };
    }
    
    const response = await fetch(blobUrl, { 
      next: { revalidate: 600 } // Cache for 10 minutes (metadata changes rarely)
    });
    
    if (!response.ok) {
      if (response.status === 404 || response.status === 403) {
        console.warn("Blob store unavailable (forbidden or not found), returning empty metadata");
        return { categories: {}, subcategories: {} };
      }
      throw new Error(`Failed to fetch categories metadata: ${response.statusText}`);
    }
    
    const data = await response.json();
    const metadata = data || { categories: {}, subcategories: {} };
    
    // Cache the result
    setCachedData('categories-metadata', metadata, blobUrl);
    
    return metadata;
  } catch (error: any) {
    if (error.status === 404 || 
        error.status === 403 ||
        error.message?.includes("not found") || 
        error.message?.includes("suspended") ||
        error.message?.includes("Forbidden") ||
        error.message?.includes("forbidden")) {
      console.warn("Blob store unavailable (suspended, forbidden, or not found), returning empty metadata");
      return { categories: {}, subcategories: {} };
    }
    console.error("Error reading categories metadata from blob:", error);
    return { categories: {}, subcategories: {} };
  }
}

export async function saveCategoriesMetadata(metadata: CategoriesMetadata): Promise<void> {
  try {
    const jsonData = JSON.stringify(metadata, null, 2);
    await put(CATEGORIES_METADATA_BLOB_PATH, jsonData, {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    });
    
    // Invalidate cache after save
    invalidateCache('categories-metadata');
    blobUrlCache.delete(CATEGORIES_METADATA_BLOB_PATH);
  } catch (error: any) {
    if (error.message?.includes("suspended")) {
      console.warn("Blob store is suspended. Cannot save categories metadata. Changes will not persist.");
      throw new Error("Vercel Blob store is suspended. Please contact support to restore access.");
    }
    console.error("Error saving categories metadata to blob:", error);
    throw error;
  }
}

export async function updateCategoryImage(categoryName: string, imageUrl: string | null): Promise<void> {
  const metadata = await getCategoriesMetadata();
  
  if (imageUrl) {
    metadata.categories[categoryName] = {
      name: categoryName,
      image: imageUrl,
    };
  } else {
    delete metadata.categories[categoryName];
  }
  
  await saveCategoriesMetadata(metadata);
}

export async function updateSubcategoryImage(
  categoryName: string,
  subcategoryName: string,
  imageUrl: string | null
): Promise<void> {
  const metadata = await getCategoriesMetadata();
  const key = `${categoryName}::${subcategoryName}`;
  
  if (imageUrl) {
    metadata.subcategories[key] = {
      categoryName,
      subcategoryName,
      image: imageUrl,
    };
  } else {
    delete metadata.subcategories[key];
  }
  
  await saveCategoriesMetadata(metadata);
}

/**
 * Admin Password Storage Functions
 */
export async function getAdminPassword(): Promise<string | null> {
  // Check cache first
  const cached = getCachedData<string | null>('admin-password');
  if (cached !== null && cached !== undefined) {
    return cached;
  }
  
  try {
    // Get blob URL (with URL caching)
    const blobUrl = await getBlobUrl(ADMIN_PASSWORD_BLOB_PATH);
    
    if (!blobUrl) {
      return null;
    }
    
    const response = await fetch(blobUrl, { 
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (!response.ok) {
      if (response.status === 404 || response.status === 403) {
        return null;
      }
      throw new Error(`Failed to fetch admin password: ${response.statusText}`);
    }
    
    const data = await response.json();
    const password = data?.password || null;
    
    // Cache the result
    setCachedData('admin-password', password, blobUrl);
    
    return password;
  } catch (error: any) {
    if (error.status === 404 || 
        error.status === 403 ||
        error.message?.includes("not found") ||
        error.message?.includes("suspended") ||
        error.message?.includes("Forbidden") ||
        error.message?.includes("forbidden")) {
      return null;
    }
    console.error("Error reading admin password from blob:", error);
    return null;
  }
}

export async function saveAdminPassword(password: string): Promise<void> {
  try {
    const jsonData = JSON.stringify({ password, updatedAt: new Date().toISOString() }, null, 2);
    await put(ADMIN_PASSWORD_BLOB_PATH, jsonData, {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    });
    
    // Invalidate cache after save
    invalidateCache('admin-password');
    blobUrlCache.delete(ADMIN_PASSWORD_BLOB_PATH);
  } catch (error: any) {
    if (error.message?.includes("suspended")) {
      console.warn("Blob store is suspended. Cannot save admin password. Changes will not persist.");
      throw new Error("Vercel Blob store is suspended. Please contact support to restore access.");
    }
    console.error("Error saving admin password to blob:", error);
    throw error;
  }
}

