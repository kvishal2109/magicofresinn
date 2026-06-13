import { getSupabaseAdmin, isSupabaseConfigured } from "./client";
import { ProductSize } from "@/types";

interface SizeConfigurationRow {
  id?: number;
  product_id: string;
  size_id: string;
  size_label: string;
  dimensions: string;
  price_modifier: number;
}

function mapRowToProductSize(row: SizeConfigurationRow): ProductSize {
  return {
    id: row.size_id,
    label: row.size_label,
    dimensions: row.dimensions,
    priceModifier: Number(row.price_modifier) || 0,
  };
}

export async function getSizeConfigurations(): Promise<Record<string, ProductSize[]>> {
  if (!isSupabaseConfigured()) {
    return {};
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("size_configurations")
    .select("*")
    .order("product_id", { ascending: true })
    .order("price_modifier", { ascending: true });

  if (error) {
    console.error("Error fetching size configurations:", error);
    return {};
  }

  const grouped: Record<string, ProductSize[]> = {};
  (data || []).forEach((row) => {
    const config = row as SizeConfigurationRow;
    if (!grouped[config.product_id]) {
      grouped[config.product_id] = [];
    }
    grouped[config.product_id].push(mapRowToProductSize(config));
  });

  return grouped;
}

export async function getProductSizeConfigurations(productId: string): Promise<ProductSize[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("size_configurations")
    .select("*")
    .eq("product_id", productId)
    .order("price_modifier", { ascending: true });

  if (error) {
    console.error("Error fetching product size configurations:", error);
    return [];
  }

  return (data || []).map((row) => mapRowToProductSize(row as SizeConfigurationRow));
}

export async function updateSizeConfigurations(
  configurations: Record<string, ProductSize[]>
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const supabase = getSupabaseAdmin();

    const { error: deleteError } = await supabase
      .from("size_configurations")
      .delete()
      .not("id", "is", null);

    if (deleteError) {
      console.error("Error clearing size configurations:", deleteError);
      return false;
    }

    const insertData: Omit<SizeConfigurationRow, "id">[] = [];
    Object.entries(configurations).forEach(([productId, sizes]) => {
      sizes.forEach((size) => {
        if (!size.id?.trim() || !size.label?.trim()) return;
        insertData.push({
          product_id: productId,
          size_id: size.id.trim(),
          size_label: size.label.trim(),
          dimensions: size.dimensions?.trim() || "",
          price_modifier: Number(size.priceModifier) || 0,
        });
      });
    });

    if (insertData.length === 0) {
      return true;
    }

    const { error: insertError } = await supabase.from("size_configurations").insert(insertData);
    if (insertError) {
      console.error("Error inserting size configurations:", insertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating size configurations:", error);
    return false;
  }
}

export async function getProductSizes(product: { id: string }): Promise<ProductSize[] | undefined> {
  const sizes = await getProductSizeConfigurations(product.id);
  return sizes.length > 0 ? sizes : undefined;
}

export async function hasProductSizes(product: { id: string }): Promise<boolean> {
  const sizes = await getProductSizes(product);
  return !!sizes && sizes.length > 0;
}
