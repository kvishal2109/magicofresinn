import { getSupabaseAdmin } from "./client";

function normKey(s: string): string {
  return s.trim().toLowerCase();
}

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

    const { data: catRows, error: selErr } = await supabase
      .from("categories_metadata")
      .select("id, category_name")
      .is("subcategory_name", null);

    if (selErr) throw selErr;

    const want = normKey(categoryName);
    const existing = (catRows || []).find((r) => normKey(r.category_name) === want);

    if (existing) {
      const { error } = await supabase
        .from("categories_metadata")
        .update({ image: imageUrl })
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from("categories_metadata").insert({
        category_name: categoryName.trim(),
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

    const { data: subRows, error: selErr } = await supabase
      .from("categories_metadata")
      .select("id, category_name, subcategory_name")
      .not("subcategory_name", "is", null);

    if (selErr) throw selErr;

    const cat = normKey(categoryName);
    const sub = normKey(subcategoryName);
    const existing = (subRows || []).find(
      (r) =>
        r.subcategory_name &&
        normKey(r.category_name) === cat &&
        normKey(r.subcategory_name) === sub
    );

    if (existing) {
      const { error } = await supabase
        .from("categories_metadata")
        .update({ image: imageUrl })
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from("categories_metadata").insert({
        category_name: categoryName.trim(),
        subcategory_name: subcategoryName.trim(),
        image: imageUrl,
      });

      if (error) throw error;
    }
  } catch (error) {
    console.error("Error updating subcategory image:", error);
    throw error;
  }
}

/**
 * Delete category metadata including all subcategory metadata rows
 */
export async function deleteCategoryMetadata(categoryName: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { data: rows, error: selErr } = await supabase
      .from("categories_metadata")
      .select("id, category_name");

    if (selErr) throw selErr;

    const want = normKey(categoryName);
    const ids = (rows || [])
      .filter((r) => normKey(r.category_name) === want)
      .map((r) => r.id);

    for (const id of ids) {
      const { error } = await supabase.from("categories_metadata").delete().eq("id", id);
      if (error) throw error;
    }
  } catch (error) {
    console.error("Error deleting category metadata:", error);
    throw error;
  }
}

/**
 * Rename a category metadata row and its subcategory rows
 */
export async function renameCategoryMetadata(
  oldCategoryName: string,
  newCategoryName: string
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { data: rows, error: selErr } = await supabase
      .from("categories_metadata")
      .select("id, category_name");

    if (selErr) throw selErr;

    const want = normKey(oldCategoryName);
    const ids = (rows || [])
      .filter((r) => normKey(r.category_name) === want)
      .map((r) => r.id);

    for (const id of ids) {
      const { error } = await supabase
        .from("categories_metadata")
        .update({ category_name: newCategoryName })
        .eq("id", id);
      if (error) throw error;
    }
  } catch (error) {
    console.error("Error renaming category metadata:", error);
    throw error;
  }
}

/**
 * Rename a specific subcategory metadata row
 */
export async function renameSubcategoryMetadata(
  categoryName: string,
  oldSubcategoryName: string,
  newSubcategoryName: string
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { data: rows, error: selErr } = await supabase
      .from("categories_metadata")
      .select("id, category_name, subcategory_name")
      .not("subcategory_name", "is", null);

    if (selErr) throw selErr;

    const cat = normKey(categoryName);
    const oldSub = normKey(oldSubcategoryName);

    const row = (rows || []).find(
      (r) =>
        r.subcategory_name &&
        normKey(r.category_name) === cat &&
        normKey(r.subcategory_name) === oldSub
    );

    if (!row) {
      return;
    }

    const { error } = await supabase
      .from("categories_metadata")
      .update({ subcategory_name: newSubcategoryName })
      .eq("id", row.id);

    if (error) {
      if ((error as { code?: string }).code === "23505") {
        throw new Error(
          "A subcategory with that name already exists in this category."
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error renaming subcategory metadata:", error);
    throw error;
  }
}

/**
 * Delete a specific subcategory metadata row
 */
export async function deleteSubcategoryMetadata(
  categoryName: string,
  subcategoryName: string
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { data: rows, error: selErr } = await supabase
      .from("categories_metadata")
      .select("id, category_name, subcategory_name")
      .not("subcategory_name", "is", null);

    if (selErr) throw selErr;

    const cat = normKey(categoryName);
    const sub = normKey(subcategoryName);
    const row = (rows || []).find(
      (r) =>
        r.subcategory_name &&
        normKey(r.category_name) === cat &&
        normKey(r.subcategory_name) === sub
    );

    if (!row) return;

    const { error } = await supabase.from("categories_metadata").delete().eq("id", row.id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting subcategory metadata:", error);
    throw error;
  }
}

