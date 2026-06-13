import { Product } from "@/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "./client";
import { getCategoryById, getSubcategoryById } from "./catalog-db";

function mapRowToProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    price: parseFloat(String(row.price)),
    originalPrice: row.original_price ? parseFloat(String(row.original_price)) : undefined,
    discount: row.discount ? parseFloat(String(row.discount)) : undefined,
    image: row.image as string,
    images: (row.images as string[]) || [],
    category: row.category as string,
    subcategory: (row.subcategory as string) || undefined,
    categoryId: (row.category_id as string) || undefined,
    subcategoryId: (row.subcategory_id as string) || undefined,
    inStock: (row.in_stock as boolean) ?? true,
    stock: (row.stock as number) || undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

async function enrichProductsWithCatalogSlugs(products: Product[]): Promise<void> {
  if (products.length === 0) return;

  const supabase = getSupabaseAdmin();
  const categoryIds = [...new Set(products.map((p) => p.categoryId).filter(Boolean))] as string[];
  const subcategoryIds = [...new Set(products.map((p) => p.subcategoryId).filter(Boolean))] as string[];

  const [categoryRes, subcategoryRes] = await Promise.all([
    categoryIds.length
      ? supabase.from("categories").select("id, slug").in("id", categoryIds)
      : Promise.resolve({ data: [], error: null }),
    subcategoryIds.length
      ? supabase.from("subcategories").select("id, slug").in("id", subcategoryIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const categorySlugs = new Map(
    (categoryRes.data || []).map((row) => [row.id as string, row.slug as string])
  );
  const subcategorySlugs = new Map(
    (subcategoryRes.data || []).map((row) => [row.id as string, row.slug as string])
  );

  for (const product of products) {
    if (product.categoryId) {
      product.categorySlug = categorySlugs.get(product.categoryId);
    }
    if (product.subcategoryId) {
      product.subcategorySlug = subcategorySlugs.get(product.subcategoryId);
    }
  }
}

async function resolveCatalogLabels(input: {
  categoryId?: string | null;
  subcategoryId?: string | null;
}): Promise<{ category: string; subcategory: string | null }> {
  if (!input.categoryId) {
    throw new Error("categoryId is required");
  }

  const category = await getCategoryById(input.categoryId);
  if (!category) {
    throw new Error("Category not found");
  }

  if (!input.subcategoryId) {
    return { category: category.name, subcategory: null };
  }

  const subcategory = await getSubcategoryById(input.subcategoryId);
  if (!subcategory || subcategory.category_id !== input.categoryId) {
    throw new Error("Subcategory not found in selected category");
  }

  return { category: category.name, subcategory: subcategory.name };
}

export async function getAllProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    console.log("Supabase not configured, returning empty product list");
    return [];
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products from Supabase:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const products = data.map(mapRowToProduct);
    await enrichProductsWithCatalogSlugs(products);
    return products;
  } catch (error) {
    console.error("Error fetching products from Supabase:", error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;

    const product = mapRowToProduct(data);
    await enrichProductsWithCatalogSlugs([product]);
    return product;
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return null;
  }
}

export async function getProductsByCatalog(
  categoryId: string,
  subcategoryId: string
): Promise<Product[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category_id", categoryId)
      .eq("subcategory_id", subcategoryId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    const products = data.map(mapRowToProduct);
    await enrichProductsWithCatalogSlugs(products);
    return products;
  } catch (error) {
    console.error("Error fetching products by catalog:", error);
    return [];
  }
}

export async function createProduct(
  productData: Omit<Product, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const supabase = getSupabaseAdmin();
    const productId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const labels = await resolveCatalogLabels({
      categoryId: productData.categoryId,
      subcategoryId: productData.subcategoryId,
    });

    const { error } = await supabase.from("products").insert({
      id: productId,
      name: productData.name,
      description: productData.description,
      price: productData.price,
      original_price: productData.originalPrice || null,
      discount: productData.discount || null,
      image: productData.image,
      images: productData.images || [],
      category: labels.category,
      subcategory: labels.subcategory,
      category_id: productData.categoryId || null,
      subcategory_id: productData.subcategoryId || null,
      in_stock: productData.inStock ?? true,
      stock: productData.stock || null,
    });

    if (error) throw error;
    return productId;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}

export async function updateProduct(
  productId: string,
  updates: Partial<Omit<Product, "id" | "createdAt">>
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.price !== undefined && updates.price !== null) {
      const priceValue = Number(updates.price);
      if (!isNaN(priceValue)) updateData.price = priceValue;
    }
    if (updates.originalPrice !== undefined && updates.originalPrice !== null) {
      const originalPriceValue = Number(updates.originalPrice);
      if (!isNaN(originalPriceValue)) updateData.original_price = originalPriceValue;
    }
    if (updates.discount !== undefined && updates.discount !== null) {
      const discountValue = Number(updates.discount);
      if (!isNaN(discountValue)) updateData.discount = discountValue;
    }
    if (updates.image !== undefined) updateData.image = updates.image;
    if (updates.images !== undefined) updateData.images = updates.images;
    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
    if (updates.subcategoryId !== undefined) updateData.subcategory_id = updates.subcategoryId;
    if (updates.inStock !== undefined) updateData.in_stock = updates.inStock;
    if (updates.stock !== undefined) updateData.stock = updates.stock;

    if (updates.categoryId !== undefined || updates.subcategoryId !== undefined) {
      const { data: existing, error: existingError } = await supabase
        .from("products")
        .select("category_id, subcategory_id")
        .eq("id", productId)
        .maybeSingle();
      if (existingError) throw existingError;

      const labels = await resolveCatalogLabels({
        categoryId:
          updates.categoryId !== undefined ? updates.categoryId : existing?.category_id,
        subcategoryId:
          updates.subcategoryId !== undefined
            ? updates.subcategoryId
            : existing?.subcategory_id,
      });
      updateData.category = labels.category;
      updateData.subcategory = labels.subcategory;
    }

    const { error } = await supabase.from("products").update(updateData).eq("id", productId);
    if (error) throw error;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) throw error;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

export async function bulkUpdatePrices(
  updates: Array<{ productId: string; price: number; originalPrice?: number; discount?: number }>
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    for (const update of updates) {
      const updateData: Record<string, unknown> = {
        price: update.price,
        updated_at: new Date().toISOString(),
      };

      if (update.originalPrice !== undefined) updateData.original_price = update.originalPrice;
      if (update.discount !== undefined) updateData.discount = update.discount;

      const { error } = await supabase.from("products").update(updateData).eq("id", update.productId);
      if (error) console.error(`Error updating product ${update.productId}:`, error);
    }
  } catch (error) {
    console.error("Error bulk updating prices:", error);
    throw error;
  }
}

export async function bulkUpdateInventory(
  updates: Array<{ productId: string; stock?: number; inStock: boolean }>
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    for (const update of updates) {
      const updateData: Record<string, unknown> = {
        in_stock: update.inStock,
        updated_at: new Date().toISOString(),
      };

      if (update.stock !== undefined) updateData.stock = update.stock;

      const { error } = await supabase.from("products").update(updateData).eq("id", update.productId);
      if (error) console.error(`Error updating product ${update.productId}:`, error);
    }
  } catch (error) {
    console.error("Error bulk updating inventory:", error);
    throw error;
  }
}
