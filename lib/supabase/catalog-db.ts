import { toSlug } from "@/lib/data/categoryMaps";
import { getSupabaseAdmin } from "./client";
import { generateId } from "./ids";
import type {
  CatalogTree,
  CatalogTreeCategory,
  CatalogTreeSubcategory,
  DbCategory,
  DbSubcategory,
} from "./catalog-types";

function mapCategory(row: Record<string, unknown>): DbCategory {
  return row as unknown as DbCategory;
}

function mapSubcategory(row: Record<string, unknown>): DbSubcategory {
  return row as unknown as DbSubcategory;
}

async function uniqueCategorySlug(base: string, excludeId?: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  let slug = toSlug(base);
  let attempt = 0;

  while (attempt < 20) {
    let query = supabase.from("categories").select("id").eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return slug;
    attempt += 1;
    slug = `${toSlug(base)}-${attempt}`;
  }
  return `${toSlug(base)}-${Date.now()}`;
}

async function uniqueSubcategorySlug(
  base: string,
  categoryId: string,
  excludeId?: string
): Promise<string> {
  const supabase = getSupabaseAdmin();
  let slug = toSlug(base);
  let attempt = 0;

  while (attempt < 20) {
    let query = supabase
      .from("subcategories")
      .select("id")
      .eq("category_id", categoryId)
      .eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return slug;
    attempt += 1;
    slug = `${toSlug(base)}-${attempt}`;
  }
  return `${toSlug(base)}-${Date.now()}`;
}

export async function listCategories(includeInactive = true): Promise<DbCategory[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("categories").select("*").order("sort_order").order("name");
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapCategory);
}

export async function getCategoryById(id: string): Promise<DbCategory | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapCategory(data) : null;
}

export async function createCategory(input: {
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
}): Promise<DbCategory> {
  const supabase = getSupabaseAdmin();
  const slug = input.slug ? toSlug(input.slug) : await uniqueCategorySlug(input.name);
  const id = generateId("category");
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      id,
      name: input.name.trim(),
      slug,
      description: input.description || null,
      image_url: input.image_url || null,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapCategory(data);
}

export async function updateCategory(
  id: string,
  updates: Partial<Omit<DbCategory, "id" | "created_at">>
): Promise<DbCategory> {
  const supabase = getSupabaseAdmin();
  const existing = await getCategoryById(id);
  if (!existing) throw new Error("Category not found");

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.slug !== undefined) payload.slug = toSlug(updates.slug);
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.image_url !== undefined) payload.image_url = updates.image_url;
  if (updates.sort_order !== undefined) payload.sort_order = updates.sort_order;
  if (updates.is_active !== undefined) payload.is_active = updates.is_active;

  const { data, error } = await supabase
    .from("categories")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  if (updates.name !== undefined && updates.name !== existing.name) {
    await supabase
      .from("products")
      .update({ category: updates.name.trim(), updated_at: new Date().toISOString() })
      .eq("category_id", id);
  }

  return mapCategory(data);
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function listSubcategories(
  categoryId?: string,
  includeInactive = true
): Promise<DbSubcategory[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("subcategories").select("*").order("sort_order").order("name");
  if (categoryId) query = query.eq("category_id", categoryId);
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapSubcategory);
}

export async function getSubcategoryById(id: string): Promise<DbSubcategory | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("subcategories").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapSubcategory(data) : null;
}

export async function createSubcategory(input: {
  category_id: string;
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
}): Promise<DbSubcategory> {
  const supabase = getSupabaseAdmin();
  const slug = input.slug
    ? toSlug(input.slug)
    : await uniqueSubcategorySlug(input.name, input.category_id);
  const id = generateId("subcategory");
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("subcategories")
    .insert({
      id,
      category_id: input.category_id,
      name: input.name.trim(),
      slug,
      description: input.description || null,
      image_url: input.image_url || null,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapSubcategory(data);
}

export async function updateSubcategory(
  id: string,
  updates: Partial<Omit<DbSubcategory, "id" | "created_at">>
): Promise<DbSubcategory> {
  const supabase = getSupabaseAdmin();
  const existing = await getSubcategoryById(id);
  if (!existing) throw new Error("Subcategory not found");

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.slug !== undefined) payload.slug = toSlug(updates.slug);
  if (updates.category_id !== undefined) payload.category_id = updates.category_id;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.image_url !== undefined) payload.image_url = updates.image_url;
  if (updates.sort_order !== undefined) payload.sort_order = updates.sort_order;
  if (updates.is_active !== undefined) payload.is_active = updates.is_active;

  const { data, error } = await supabase
    .from("subcategories")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  if (updates.name !== undefined && updates.name !== existing.name) {
    await supabase
      .from("products")
      .update({ subcategory: updates.name.trim(), updated_at: new Date().toISOString() })
      .eq("subcategory_id", id);
  }

  return mapSubcategory(data);
}

export async function deleteSubcategory(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("subcategories").delete().eq("id", id);
  if (error) throw error;
}

export async function getCatalogTree(activeOnly = true): Promise<CatalogTree> {
  const supabase = getSupabaseAdmin();

  let categoryQuery = supabase.from("categories").select("*").order("sort_order").order("name");
  let subcategoryQuery = supabase.from("subcategories").select("*").order("sort_order").order("name");

  if (activeOnly) {
    categoryQuery = categoryQuery.eq("is_active", true);
    subcategoryQuery = subcategoryQuery.eq("is_active", true);
  }

  const [categoryRes, subcategoryRes, productRes] = await Promise.all([
    categoryQuery,
    subcategoryQuery,
    supabase.from("products").select("category_id, subcategory_id"),
  ]);

  if (categoryRes.error) throw categoryRes.error;
  if (subcategoryRes.error) throw subcategoryRes.error;
  if (productRes.error) throw productRes.error;

  const categories = (categoryRes.data || []).map(mapCategory);
  const subcategories = (subcategoryRes.data || []).map(mapSubcategory);
  const products = productRes.data || [];

  const categoryProductCounts = new Map<string, number>();
  const subcategoryProductCounts = new Map<string, number>();
  products.forEach((p) => {
    if (p.category_id) {
      categoryProductCounts.set(p.category_id, (categoryProductCounts.get(p.category_id) || 0) + 1);
    }
    if (p.subcategory_id) {
      subcategoryProductCounts.set(
        p.subcategory_id,
        (subcategoryProductCounts.get(p.subcategory_id) || 0) + 1
      );
    }
  });

  const subsByCategory = new Map<string, CatalogTreeSubcategory[]>();
  subcategories.forEach((sub) => {
    const item: CatalogTreeSubcategory = {
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      description: sub.description || undefined,
      imageUrl: sub.image_url || undefined,
      sortOrder: sub.sort_order,
      productCount: subcategoryProductCounts.get(sub.id) || 0,
    };
    const list = subsByCategory.get(sub.category_id) || [];
    list.push(item);
    subsByCategory.set(sub.category_id, list);
  });

  const treeCategories: CatalogTreeCategory[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description || undefined,
    imageUrl: cat.image_url || undefined,
    sortOrder: cat.sort_order,
    subcategories: subsByCategory.get(cat.id) || [],
    productCount: categoryProductCounts.get(cat.id) || 0,
  }));

  return { categories: treeCategories };
}

export async function resolveCategorySubcategoryBySlugs(
  categorySlug: string,
  subcategorySlug: string
): Promise<{ category: DbCategory; subcategory: DbSubcategory } | null> {
  const supabase = getSupabaseAdmin();

  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", categorySlug)
    .eq("is_active", true);

  if (catError) throw catError;
  if (!categories?.length) return null;

  for (const catRow of categories) {
    const category = mapCategory(catRow);
    const { data: subRow, error: subError } = await supabase
      .from("subcategories")
      .select("*")
      .eq("category_id", category.id)
      .eq("slug", subcategorySlug)
      .eq("is_active", true)
      .maybeSingle();

    if (subError) throw subError;
    if (subRow) {
      return { category, subcategory: mapSubcategory(subRow) };
    }
  }

  return null;
}
