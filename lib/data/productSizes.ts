import { getSizeConfigurations } from "@/lib/supabase/sizes";
import { ProductSize } from "@/types";

// Helper function to get sizes for a product
export async function getProductSizes(product: { subcategory?: string; name: string }): Promise<ProductSize[] | undefined> {
  const key = product.subcategory || product.name;
  const configurations = await getSizeConfigurations();
  return configurations[key];
}

// Helper function to check if a product has size options
export async function hasProductSizes(product: { subcategory?: string; name: string }): Promise<boolean> {
  const sizes = await getProductSizes(product);
  return !!sizes && sizes.length > 0;
}