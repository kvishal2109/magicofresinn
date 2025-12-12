import HomeClient from "@/components/home/HomeClient";
import { getAllProducts, getAllCategories } from "@/lib/supabase/products";

export const revalidate = 300;

export default async function HomePage() {
  try {
    const [products, categories] = await Promise.all([
      getAllProducts(),
      getAllCategories(),
    ]);

    return (
      <HomeClient
        initialProducts={products}
        initialCategories={categories}
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
      />
    );
  }
}
