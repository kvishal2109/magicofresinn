import { revalidatePath } from "next/cache";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/client";

/** Bust storefront caches after catalog or product changes. */
export async function revalidateStorefrontCatalog(productId?: string) {
  try {
    revalidatePath("/");
    revalidatePath("/api/products");
    revalidatePath("/api/catalog-tree");
    revalidatePath("/products/[category]/[subcategory]", "page");

    if (productId && isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data: product } = await supabase
        .from("products")
        .select("category_id, subcategory_id")
        .eq("id", productId)
        .maybeSingle();

      if (product?.category_id) {
        const { data: category } = await supabase
          .from("categories")
          .select("slug")
          .eq("id", product.category_id)
          .maybeSingle();

        if (category?.slug && product.subcategory_id) {
          const { data: subcategory } = await supabase
            .from("subcategories")
            .select("slug")
            .eq("id", product.subcategory_id)
            .maybeSingle();

          if (subcategory?.slug) {
            revalidatePath(`/products/${category.slug}/${subcategory.slug}`);
          }
        }
      }

      revalidatePath(`/product/${productId}`);
    }
  } catch (error) {
    console.error("Error revalidating storefront catalog:", error);
  }
}
