import { Product } from "@/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "./client";
import { listCategories } from "./catalog-db";

/**
 * Get all products from Supabase
 * Falls back to hardcoded products if database is empty or not configured
 */
export async function getAllProducts(): Promise<Product[]> {
  // If Supabase is not configured, use hardcoded products
  if (!isSupabaseConfigured()) {
    console.log("Supabase not configured, returning empty product list");
    return [];
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching products from Supabase:", error);
      console.log("Falling back to empty product list");
      return [];
    }

    if (!data || data.length === 0) {
      console.log("No products in database");
      return [];
    }

    console.log(`Found ${data.length} products in database`);

    // Convert database format to Product format
    const products: Product[] = data.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
      discount: row.discount ? parseFloat(row.discount) : undefined,
      image: row.image,
      images: row.images || [],
      category: row.category,
      subcategory: row.subcategory || undefined,
      categoryId: row.category_id || undefined,
      subcategoryId: row.subcategory_id || undefined,
      inStock: row.in_stock ?? true,
      stock: row.stock || undefined,
      catalogId: row.catalog_id || undefined,
      catalogName: row.catalog_name || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    return products;
  } catch (error) {
    console.error("Error fetching products from Supabase:", error);
    return [];
  }
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const products = await getAllProducts();
    return products.find((p) => p.id === id) || null;
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return null;
  }
}

/**
 * Get products by category
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error || !data) {
      const products = await getAllProducts();
      return products.filter((p) => p.category === category);
    }

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
      discount: row.discount ? parseFloat(row.discount) : undefined,
      image: row.image,
      images: row.images || [],
      category: row.category,
      subcategory: row.subcategory || undefined,
      categoryId: row.category_id || undefined,
      subcategoryId: row.subcategory_id || undefined,
      inStock: row.in_stock ?? true,
      stock: row.stock || undefined,
      catalogId: row.catalog_id || undefined,
      catalogName: row.catalog_name || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  } catch (error) {
    console.error("Error fetching products by category:", error);
    const products = await getAllProducts();
    return products.filter((p) => p.category === category);
  }
}

/**
 * Get products by catalog
 */
export async function getProductsByCatalog(catalogId: string): Promise<Product[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('catalog_id', catalogId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      const products = await getAllProducts();
      return products.filter((p) => p.catalogId === catalogId);
    }

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
      discount: row.discount ? parseFloat(row.discount) : undefined,
      image: row.image,
      images: row.images || [],
      category: row.category,
      subcategory: row.subcategory || undefined,
      categoryId: row.category_id || undefined,
      subcategoryId: row.subcategory_id || undefined,
      inStock: row.in_stock ?? true,
      stock: row.stock || undefined,
      catalogId: row.catalog_id || undefined,
      catalogName: row.catalog_name || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  } catch (error) {
    console.error("Error fetching products by catalog:", error);
    const products = await getAllProducts();
    return products.filter((p) => p.catalogId === catalogId);
  }
}

/**
 * Get all categories
 */
export async function getAllCategories(): Promise<string[]> {
  try {
    const categories = await listCategories(false);
    return categories
      .filter((c) => c.is_active)
      .map((c) => c.name)
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

/**
 * Admin Functions - Create product
 */
export async function createProduct(
  productData: Omit<Product, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const supabase = getSupabaseAdmin();
    const productId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const { error } = await supabase
      .from('products')
      .insert({
        id: productId,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        original_price: productData.originalPrice || null,
        discount: productData.discount || null,
        image: productData.image,
        images: productData.images || [],
        category: productData.category,
        subcategory: productData.subcategory || null,
        category_id: productData.categoryId || null,
        subcategory_id: productData.subcategoryId || null,
        in_stock: productData.inStock ?? true,
        stock: productData.stock || null,
        catalog_id: productData.catalogId || null,
        catalog_name: productData.catalogName || null,
      });

    if (error) {
      throw error;
    }

    return productId;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}

/**
 * Admin Functions - Update product
 */
export async function updateProduct(
  productId: string,
  updates: Partial<Omit<Product, "id" | "createdAt">>
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.price !== undefined && updates.price !== null) {
      const priceValue = Number(updates.price);
      if (!isNaN(priceValue)) {
        updateData.price = priceValue;
        console.log("Updating price in database to:", priceValue);
      } else {
        console.warn("Invalid price value in updateProduct:", updates.price);
      }
    }
    if (updates.originalPrice !== undefined && updates.originalPrice !== null) {
      const originalPriceValue = Number(updates.originalPrice);
      if (!isNaN(originalPriceValue)) {
        updateData.original_price = originalPriceValue;
      }
    }
    if (updates.discount !== undefined && updates.discount !== null) {
      const discountValue = Number(updates.discount);
      if (!isNaN(discountValue)) {
        updateData.discount = discountValue;
      }
    }
    if (updates.image !== undefined) updateData.image = updates.image;
    if (updates.images !== undefined) updateData.images = updates.images;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.subcategory !== undefined) updateData.subcategory = updates.subcategory;
    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
    if (updates.subcategoryId !== undefined) updateData.subcategory_id = updates.subcategoryId;
    if (updates.inStock !== undefined) updateData.in_stock = updates.inStock;
    if (updates.stock !== undefined) updateData.stock = updates.stock;
    if (updates.catalogId !== undefined) updateData.catalog_id = updates.catalogId;
    if (updates.catalogName !== undefined) updateData.catalog_name = updates.catalogName;

    console.log("Supabase update data:", JSON.stringify(updateData, null, 2));
    
    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId);

    if (error) {
      console.error("Supabase update error:", error);
      throw error;
    }
    
    console.log("Product updated successfully");
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

/**
 * Admin Functions - Delete product
 */
export async function deleteProduct(productId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

/**
 * Admin Functions - Bulk update prices
 */
export async function bulkUpdatePrices(
  updates: Array<{ productId: string; price: number; originalPrice?: number; discount?: number }>
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    
    // Update each product
    for (const update of updates) {
      const updateData: any = {
        price: update.price,
        updated_at: new Date().toISOString(),
      };
      
      if (update.originalPrice !== undefined) updateData.original_price = update.originalPrice;
      if (update.discount !== undefined) updateData.discount = update.discount;

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', update.productId);

      if (error) {
        console.error(`Error updating product ${update.productId}:`, error);
      }
    }
  } catch (error) {
    console.error("Error bulk updating prices:", error);
    throw error;
  }
}

/**
 * Admin Functions - Bulk update inventory
 */
export async function bulkUpdateInventory(
  updates: Array<{ productId: string; stock?: number; inStock: boolean }>
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    
    for (const update of updates) {
      const updateData: any = {
        in_stock: update.inStock,
        updated_at: new Date().toISOString(),
      };
      
      if (update.stock !== undefined) updateData.stock = update.stock;

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', update.productId);

      if (error) {
        console.error(`Error updating product ${update.productId}:`, error);
      }
    }
  } catch (error) {
    console.error("Error bulk updating inventory:", error);
    throw error;
  }
}

/** Case-insensitive trim compare (avoids SQL ILIKE treating `_` and `%` as wildcards). */
function normKey(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Product IDs whose category matches (exact first, then case-insensitive).
 */
async function getProductIdsInCategory(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  categoryName: string
): Promise<string[]> {
  const { data: exact, error: e1 } = await supabase
    .from("products")
    .select("id")
    .eq("category", categoryName);
  if (e1) throw e1;
  if (exact?.length) return exact.map((r) => r.id);

  const { data: all, error: e2 } = await supabase.from("products").select("id, category");
  if (e2) throw e2;
  const want = normKey(categoryName);
  return (all || []).filter((r) => normKey(r.category) === want).map((r) => r.id);
}

/**
 * Product IDs in a category + subcategory (exact match first, then case-insensitive; no ILIKE wildcards).
 */
async function getProductIdsInCategorySubcategory(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  categoryName: string,
  subcategoryName: string
): Promise<string[]> {
  const { data: exact, error: e1 } = await supabase
    .from("products")
    .select("id")
    .eq("category", categoryName)
    .eq("subcategory", subcategoryName);
  if (e1) throw e1;
  if (exact?.length) return exact.map((r) => r.id);

  const { data: all, error: e2 } = await supabase
    .from("products")
    .select("id, category, subcategory");
  if (e2) throw e2;
  const cat = normKey(categoryName);
  const sub = normKey(subcategoryName);
  return (all || [])
    .filter(
      (r) =>
        normKey(r.category) === cat &&
        r.subcategory != null &&
        normKey(r.subcategory) === sub
    )
    .map((r) => r.id);
}

/**
 * Admin Functions - Bulk update category (rename category)
 */
export async function bulkUpdateCategory(
  oldCategory: string,
  newCategory: string
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const ids = await getProductIdsInCategory(supabase, oldCategory);
    if (ids.length === 0) return;

    const { error } = await supabase
      .from("products")
      .update({
        category: newCategory,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids);

    if (error) throw error;
  } catch (error) {
    console.error("Error bulk updating category:", error);
    throw error;
  }
}

/**
 * Admin Functions - Bulk update subcategory (rename subcategory within a category)
 */
export async function bulkUpdateSubcategory(
  categoryName: string,
  oldSubcategory: string,
  newSubcategory: string
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const ids = await getProductIdsInCategorySubcategory(
      supabase,
      categoryName,
      oldSubcategory
    );
    if (ids.length === 0) return;

    const { error } = await supabase
      .from("products")
      .update({
        subcategory: newSubcategory,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids);

    if (error) throw error;
  } catch (error) {
    console.error("Error bulk updating subcategory:", error);
    throw error;
  }
}

/**
 * Admin Functions - Delete category (delete all products in category)
 */
export async function deleteCategory(category: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const ids = await getProductIdsInCategory(supabase, category);
    if (ids.length === 0) return;

    const { error } = await supabase.from("products").delete().in("id", ids);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
}

