import { getSupabaseAdmin } from "./client";

export interface CategoriesMetadata {
  categories: Record<string, { name: string; image?: string }>;
  subcategories: Record<string, { categoryName: string; subcategoryName: string; image?: string }>;
}

/**
 * Get categories metadata from Supabase
 */
export async function getCategoriesMetadata(): Promise<CategoriesMetadata> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('categories_metadata')
      .select('*');

    if (error || !data) {
      return { categories: {}, subcategories: {} };
    }

    const categories: Record<string, { name: string; image?: string }> = {};
    const subcategories: Record<string, { categoryName: string; subcategoryName: string; image?: string }> = {};

    data.forEach((row: any) => {
      if (row.subcategory_name) {
        const key = `${row.category_name}::${row.subcategory_name}`;
        subcategories[key] = {
          categoryName: row.category_name,
          subcategoryName: row.subcategory_name,
          image: row.image || undefined,
        };
      } else {
        categories[row.category_name] = {
          name: row.category_name,
          image: row.image || undefined,
        };
      }
    });

    return { categories, subcategories };
  } catch (error) {
    console.error("Error fetching categories metadata:", error);
    return { categories: {}, subcategories: {} };
  }
}

/**
 * Save categories metadata to Supabase
 */
export async function saveCategoriesMetadata(metadata: CategoriesMetadata): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    // Delete all existing metadata
    await supabase.from('categories_metadata').delete().neq('id', 0);

    // Insert categories
    const categoryInserts = Object.values(metadata.categories).map((cat) => ({
      category_name: cat.name,
      subcategory_name: null,
      image: cat.image || null,
    }));

    // Insert subcategories
    const subcategoryInserts = Object.values(metadata.subcategories).map((sub) => ({
      category_name: sub.categoryName,
      subcategory_name: sub.subcategoryName,
      image: sub.image || null,
    }));

    const allInserts = [...categoryInserts, ...subcategoryInserts];

    if (allInserts.length > 0) {
      const { error } = await supabase
        .from('categories_metadata')
        .insert(allInserts);

      if (error) throw error;
    }
  } catch (error) {
    console.error("Error saving categories metadata:", error);
    throw error;
  }
}

/**
 * Update category image
 */
export async function updateCategoryImage(categoryName: string, imageUrl: string | null): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    // Check if exists
    const { data: existing } = await supabase
      .from('categories_metadata')
      .select('id')
      .eq('category_name', categoryName)
      .is('subcategory_name', null)
      .single();

    if (existing) {
      // Update
      const { error } = await supabase
        .from('categories_metadata')
        .update({ image: imageUrl })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Insert
      const { error } = await supabase
        .from('categories_metadata')
        .insert({
          category_name: categoryName,
          subcategory_name: null,
          image: imageUrl,
        });

      if (error) throw error;
    }
  } catch (error) {
    console.error("Error updating category image:", error);
    throw error;
  }
}

/**
 * Update subcategory image
 */
export async function updateSubcategoryImage(
  categoryName: string,
  subcategoryName: string,
  imageUrl: string | null
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    // Check if exists
    const { data: existing } = await supabase
      .from('categories_metadata')
      .select('id')
      .eq('category_name', categoryName)
      .eq('subcategory_name', subcategoryName)
      .single();

    if (existing) {
      // Update
      const { error } = await supabase
        .from('categories_metadata')
        .update({ image: imageUrl })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Insert
      const { error } = await supabase
        .from('categories_metadata')
        .insert({
          category_name: categoryName,
          subcategory_name: subcategoryName,
          image: imageUrl,
        });

      if (error) throw error;
    }
  } catch (error) {
    console.error("Error updating subcategory image:", error);
    throw error;
  }
}

