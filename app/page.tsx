import HomeClient from "@/components/home/HomeClient";
import { getAllProducts, getAllCategories } from "@/lib/supabase/products";
import { getCategoriesMetadata } from "@/lib/supabase/categories";

export const revalidate = 300;

export default async function HomePage() {
  try {
    const [products, categories, categoriesMetadata] = await Promise.all([
      getAllProducts(),
      getAllCategories(),
      getCategoriesMetadata(),
    ]);

    return (
      <HomeClient
        initialProducts={products}
        initialCategories={categories}
        initialCategoriesMetadata={categoriesMetadata}
      />
    );
  } catch (error) {
    // If there's any error, fall back to hardcoded products
    console.error("Error loading homepage, using fallback:", error);
    const { hardcodedProducts } = await import("@/lib/data/products");
    const fallbackCategories = [...new Set(hardcodedProducts.map(p => p.category))];
    
    return (
      <HomeClient
        initialProducts={hardcodedProducts}
        initialCategories={fallbackCategories}
        initialCategoriesMetadata={{ categories: {}, subcategories: {} }}
      />
    );
  }
}
