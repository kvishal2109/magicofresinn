import { notFound } from "next/navigation";
import SubcategoryProductsClient from "@/components/products/SubcategoryProductsClient";
import { getAllProducts } from "@/lib/supabase/products";
import { getCategoryNameFromSlug, getSubcategoryNameFromSlug } from "@/lib/data/categoryMaps";

export const revalidate = 300;

interface PageParams {
  category: string;
  subcategory: string;
}

export default async function SubcategoryProductsPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  // Await params in Next.js 16+
  const resolvedParams = await params;
  
  // Defensive check for params
  if (!resolvedParams?.category || !resolvedParams?.subcategory) {
    notFound();
  }

  const categoryName = getCategoryNameFromSlug(resolvedParams.category);
  const subcategoryName = getSubcategoryNameFromSlug(resolvedParams.subcategory);

  if (!categoryName || !subcategoryName) {
    notFound();
  }

  const allProducts = await getAllProducts();
  const filteredProducts = allProducts.filter(
    (product) =>
      product.category === categoryName && product.subcategory === subcategoryName
  );

  return (
    <SubcategoryProductsClient
      products={filteredProducts}
      categoryName={categoryName}
      subcategoryName={subcategoryName}
    />
  );
}
