import { getSupabaseAdmin } from "./client";
import { getCategoriesMetadata } from "./categories";
import {
  createCategory,
  createSubcategory,
  listCategories,
  listSubcategories,
} from "./catalog-db";
import { generateId } from "./ids";

/**
 * Migrate categories_metadata + product text fields into normalized tables.
 * Safe to run multiple times (skips existing slugs).
 */
export async function migrateLegacyCatalogData(): Promise<{
  categoriesCreated: number;
  subcategoriesCreated: number;
  productsUpdated: number;
}> {
  const supabase = getSupabaseAdmin();
  let categoriesCreated = 0;
  let subcategoriesCreated = 0;
  let productsUpdated = 0;

  const existingCategories = await listCategories(true);
  const categoryByName = new Map(
    existingCategories.map((c) => [c.name.trim().toLowerCase(), c])
  );

  const metadata = await getCategoriesMetadata();

  for (const cat of Object.values(metadata.categories)) {
    const key = cat.name.trim().toLowerCase();
    if (!categoryByName.has(key)) {
      const created = await createCategory({
        name: cat.name,
        image_url: cat.image || undefined,
      });
      categoryByName.set(key, created);
      categoriesCreated += 1;
    } else if (cat.image) {
      const existing = categoryByName.get(key)!;
      if (!existing.image_url) {
        await supabase
          .from("categories")
          .update({ image_url: cat.image, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      }
    }
  }

  for (const sub of Object.values(metadata.subcategories)) {
    const catKey = sub.categoryName.trim().toLowerCase();
    let category = categoryByName.get(catKey);
    if (!category) {
      category = await createCategory({ name: sub.categoryName });
      categoryByName.set(catKey, category);
      categoriesCreated += 1;
    }

    const subs = await listSubcategories(category.id, true);
    const subExists = subs.some(
      (s) => s.name.trim().toLowerCase() === sub.subcategoryName.trim().toLowerCase()
    );
    if (!subExists) {
      await createSubcategory({
        category_id: category.id,
        name: sub.subcategoryName,
        image_url: sub.image || undefined,
      });
      subcategoriesCreated += 1;
    }
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, category, subcategory, category_id, subcategory_id");

  if (productsError) throw productsError;

  for (const product of products || []) {
    if (!product.category) continue;

    const catKey = product.category.trim().toLowerCase();
    let category = categoryByName.get(catKey);
    if (!category) {
      category = await createCategory({ name: product.category });
      categoryByName.set(catKey, category);
      categoriesCreated += 1;
    }

    let subcategoryId: string | null = product.subcategory_id || null;

    if (product.subcategory) {
      const subs = await listSubcategories(category.id, true);
      let sub = subs.find(
        (s) => s.name.trim().toLowerCase() === product.subcategory.trim().toLowerCase()
      );
      if (!sub) {
        sub = await createSubcategory({
          category_id: category.id,
          name: product.subcategory,
        });
        subcategoriesCreated += 1;
      }
      subcategoryId = sub.id;
    }

    if (product.category_id !== category.id || product.subcategory_id !== subcategoryId) {
      const { error: updateError } = await supabase
        .from("products")
        .update({
          category_id: category.id,
          subcategory_id: subcategoryId,
          category: category.name,
          subcategory: product.subcategory || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id);

      if (updateError) throw updateError;
      productsUpdated += 1;
    }
  }

  return { categoriesCreated, subcategoriesCreated, productsUpdated };
}

/** Seed hardcoded PDF catalogs into DB if empty */
export async function seedDefaultCatalogsFromStatic(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count } = await supabase.from("catalogs").select("*", { count: "exact", head: true });
  if (count && count > 0) return 0;

  const now = new Date().toISOString();
  const seeds = [
    {
      id: generateId("catalog"),
      name: "Home Decor Collection",
      slug: "home-decor",
      description: "Home decor pieces, clocks, lamps, and wall art.",
      type: "pdf",
      pdf_url: "/Catalog (Home Decor).Pdf.1.pdf",
      cover_image_url: "/sh.jpeg",
      is_active: true,
      sort_order: 10,
      created_at: now,
      updated_at: now,
    },
    {
      id: generateId("catalog"),
      name: "Wedding & Gifts Catalog",
      slug: "weddings",
      description: "Wedding platters, keepsakes, and celebration gifts.",
      type: "pdf",
      pdf_url: "/Catalog(Weddings with price).1.pdf",
      cover_image_url: "/sh.jpeg",
      is_active: true,
      sort_order: 20,
      created_at: now,
      updated_at: now,
    },
  ];

  const { error } = await supabase.from("catalogs").insert(seeds);
  if (error) throw error;
  return seeds.length;
}
