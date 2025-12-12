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
  params: PageParams;
}) {
  // Defensive check for params
  if (!params?.category || !params?.subcategory) {
    notFound();
  }

  const categoryName = getCategoryNameFromSlug(params.category);
  const subcategoryName = getSubcategoryNameFromSlug(params.subcategory);

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
