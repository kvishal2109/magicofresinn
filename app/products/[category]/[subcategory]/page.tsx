import { notFound } from "next/navigation";
import SubcategoryProductsClient from "@/components/products/SubcategoryProductsClient";
import { getAllProducts } from "@/lib/supabase/products";
import { resolveCategorySubcategoryBySlugs } from "@/lib/supabase/catalog-db";

export const revalidate = 300;

interface PageParams {
  category: string;
  subcategory: string;
}

const normalize = (value: string) => value.trim().toLowerCase();

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
  const allProducts = await getAllProducts();

  const filteredProducts = allProducts.filter(
    (product) =>
      (product.categoryId === category.id ||
        normalize(product.category) === normalize(category.name)) &&
      (product.subcategoryId === subcategory.id ||
        normalize(product.subcategory || "") === normalize(subcategory.name))
  );

  return (
    <SubcategoryProductsClient
      products={filteredProducts}
      categoryName={category.name}
      subcategoryName={subcategory.name}
    />
  );
}
