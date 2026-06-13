import { notFound } from "next/navigation";
import SubcategoryProductsClient from "@/components/products/SubcategoryProductsClient";
import { getProductsByCatalog } from "@/lib/supabase/products";
import { resolveCategorySubcategoryBySlugs } from "@/lib/supabase/catalog-db";

export const revalidate = 60;

interface PageParams {
  category: string;
  subcategory: string;
}

export default async function SubcategoryProductsPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const resolvedParams = await params;

  if (!resolvedParams?.category || !resolvedParams?.subcategory) {
    notFound();
  }

  const resolved = await resolveCategorySubcategoryBySlugs(
    resolvedParams.category,
    resolvedParams.subcategory
  );

  if (!resolved) {
    notFound();
  }

  const { category, subcategory } = resolved;
  const filteredProducts = await getProductsByCatalog(category.id, subcategory.id);

  return (
    <SubcategoryProductsClient
      products={filteredProducts}
      categoryName={category.name}
      subcategoryName={subcategory.name}
    />
  );
}
