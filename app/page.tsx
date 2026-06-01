import HomeClient from "@/components/home/HomeClient";
import { getAllProducts } from "@/lib/supabase/products";

export const revalidate = 300;

export default async function HomePage() {
  try {
    const products = await getAllProducts();

    return <HomeClient initialProducts={products} />;
  } catch (error) {
    console.error("Error loading homepage, using fallback:", error);
    const { hardcodedProducts } = await import("@/lib/data/products");

    return <HomeClient initialProducts={hardcodedProducts} />;
  }
}
