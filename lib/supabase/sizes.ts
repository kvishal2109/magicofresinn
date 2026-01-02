import { supabase } from "./client";
import { ProductSize } from "@/types";

export interface SizeConfiguration {
  id?: number;
  category_name: string;
  size_id: string;
  size_label: string;
  dimensions: string;
  price_modifier: number;
}

export async function getSizeConfigurations(): Promise<Record<string, ProductSize[]>> {
  const { data, error } = await supabase
    .from("size_configurations")
    .select("*")
    .order("category_name", { ascending: true })
    .order("price_modifier", { ascending: true });

  if (error) {
    console.error("Error fetching size configurations:", error);
    return {};
  }

  // Group by category
  const grouped: Record<string, ProductSize[]> = {};
  data?.forEach((config) => {
    if (!grouped[config.category_name]) {
      grouped[config.category_name] = [];
    }
    grouped[config.category_name].push({
      id: config.size_id,
      label: config.size_label,
      dimensions: config.dimensions,
      priceModifier: config.price_modifier,
    });
  });

  return grouped;
}

export async function updateSizeConfigurations(
  configurations: Record<string, ProductSize[]>
): Promise<boolean> {
  try {
    // Delete all existing configurations
    await supabase.from("size_configurations").delete().neq("id", 0);

    // Insert new configurations
    const insertData: Omit<SizeConfiguration, "id">[] = [];
    Object.entries(configurations).forEach(([categoryName, sizes]) => {
      sizes.forEach((size) => {
        insertData.push({
          category_name: categoryName,
          size_id: size.id,
          size_label: size.label,
          dimensions: size.dimensions,
          price_modifier: size.priceModifier,
        });
      });
    });

    if (insertData.length > 0) {
      const { error } = await supabase
        .from("size_configurations")
        .insert(insertData);

      if (error) {
        console.error("Error inserting size configurations:", error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error updating size configurations:", error);
    return false;
  }
}

export async function getProductSizes(product: { 
  subcategory?: string; 
  name: string 
}): Promise<ProductSize[] | undefined> {
  const key = product.subcategory || product.name;
  const configurations = await getSizeConfigurations();
  return configurations[key];
}

export async function hasProductSizes(product: { 
  subcategory?: string; 
  name: string 
}): Promise<boolean> {
  const sizes = await getProductSizes(product);
  return !!sizes && sizes.length > 0;
}