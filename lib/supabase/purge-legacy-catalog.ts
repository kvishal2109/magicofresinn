import { getSupabaseAdmin, isSupabaseConfigured } from "./client";

export const LEGACY_CATEGORIES = [
  "Wedding",
  "Jewellery",
  "Home Decor",
  "Furniture",
] as const;

function norm(value: string): string {
  return value.trim().toLowerCase();
}

export interface LegacyCatalogPurgeResult {
  deletedProducts: number;
  deletedMetadataRows: number;
}

/**
 * Remove legacy static catalog categories from Supabase.
 * Deletes products in Wedding/Jewellery/Home Decor/Furniture and all related metadata rows.
 */
export async function purgeLegacyCatalogFromDatabase(): Promise<LegacyCatalogPurgeResult> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const supabase = getSupabaseAdmin();
  const legacyKeys = new Set(LEGACY_CATEGORIES.map(norm));

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, category");

  if (productsError) {
    throw productsError;
  }

  const productIdsToDelete = (products || [])
    .filter((row) => row.category && legacyKeys.has(norm(row.category)))
    .map((row) => row.id);

  let deletedProducts = 0;
  if (productIdsToDelete.length > 0) {
    const { error: deleteProductsError } = await supabase
      .from("products")
      .delete()
      .in("id", productIdsToDelete);

    if (deleteProductsError) {
      throw deleteProductsError;
    }
    deletedProducts = productIdsToDelete.length;
  }

  const { data: metadataRows, error: metadataError } = await supabase
    .from("categories_metadata")
    .select("id, category_name");

  if (metadataError) {
    throw metadataError;
  }

  const metadataIdsToDelete = (metadataRows || [])
    .filter((row) => row.category_name && legacyKeys.has(norm(row.category_name)))
    .map((row) => row.id);

  let deletedMetadataRows = 0;
  for (const id of metadataIdsToDelete) {
    const { error: deleteMetadataError } = await supabase
      .from("categories_metadata")
      .delete()
      .eq("id", id);

    if (deleteMetadataError) {
      throw deleteMetadataError;
    }
    deletedMetadataRows += 1;
  }

  return { deletedProducts, deletedMetadataRows };
}
