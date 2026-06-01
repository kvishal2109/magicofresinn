import { notFound } from "next/navigation";
import SubcategoryProductsClient from "@/components/products/SubcategoryProductsClient";
import { getAllProducts } from "@/lib/supabase/products";
import { getCategoriesMetadata } from "@/lib/supabase/categories";
import { toSlug } from "@/lib/data/categoryMaps";

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

  const [allProducts, categoriesMetadata] = await Promise.all([
    getAllProducts(),
    getCategoriesMetadata(),
  ]);

  const productCategoryNames = allProducts.map((product) => product.category).filter(Boolean);
  const metadataCategoryNames = [
    ...Object.keys(categoriesMetadata.categories || {}),
    ...Object.values(categoriesMetadata.subcategories || {}).map((sub) => sub.categoryName),
  ].filter(Boolean);

  const allCategoryNames = [...new Set([...productCategoryNames, ...metadataCategoryNames])];

  const categoryName = allCategoryNames.find((name) => toSlug(name) === resolvedParams.category);

  if (!categoryName) {
    notFound();
  }

  const productSubcategoryNames = allProducts
    .filter((product) => normalize(product.category) === normalize(categoryName) && product.subcategory)
    .map((product) => product.subcategory as string);
  const metadataSubcategoryNames = Object.values(categoriesMetadata.subcategories || {})
    .filter((sub) => normalize(sub.categoryName) === normalize(categoryName))
    .map((sub) => sub.subcategoryName);

  const allSubcategoryNames = [...new Set([...productSubcategoryNames, ...metadataSubcategoryNames])];

  const subcategoryName = allSubcategoryNames.find(
    (name) => toSlug(name) === resolvedParams.subcategory
  );

  if (!subcategoryName) {
    notFound();
  }

  const filteredProducts = allProducts.filter(
    (product) =>
      normalize(product.category) === normalize(categoryName) &&
      normalize(product.subcategory || "") === normalize(subcategoryName)
  );

  return (
    <SubcategoryProductsClient
      products={filteredProducts}
      categoryName={categoryName}
      subcategoryName={subcategoryName}
    />
  );
}
