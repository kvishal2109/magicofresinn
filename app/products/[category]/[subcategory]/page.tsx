import { notFound } from "next/navigation";
import SubcategoryProductsClient from "@/components/products/SubcategoryProductsClient";
import { getAllProducts } from "@/lib/supabase/products";
import { getCategoriesMetadata } from "@/lib/supabase/categories";
import { getCategoryNameFromSlug, getSubcategoryNameFromSlug } from "@/lib/data/categoryMaps";

export const revalidate = 300;

interface PageParams {
  category: string;
  subcategory: string;
}

const normalize = (value: string) => value.trim().toLowerCase();
const toSlug = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "-");

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

  const [allProducts, categoriesMetadata] = await Promise.all([
    getAllProducts(),
    getCategoriesMetadata(),
  ]);

  const productCategoryNames = allProducts.map((product) => product.category).filter(Boolean);
  const metadataCategoryNames = [
    ...Object.keys(categoriesMetadata.categories || {}),
    ...Object.values(categoriesMetadata.subcategories || {}).map((sub) => sub.categoryName),
  ].filter(Boolean);

  const allCategoryNames = [...new Set([
    ...productCategoryNames,
    ...metadataCategoryNames,
  ])];

  const categoryName =
    getCategoryNameFromSlug(resolvedParams.category) ||
    allCategoryNames.find((name) => toSlug(name) === resolvedParams.category);

  if (!categoryName) {
    notFound();
  }

  const productSubcategoryNames = allProducts
    .filter((product) => normalize(product.category) === normalize(categoryName) && product.subcategory)
    .map((product) => product.subcategory as string);
  const metadataSubcategoryNames = Object.values(categoriesMetadata.subcategories || {})
    .filter((sub) => normalize(sub.categoryName) === normalize(categoryName))
    .map((sub) => sub.subcategoryName);

  const allSubcategoryNames = [...new Set([
    ...productSubcategoryNames,
    ...metadataSubcategoryNames,
  ])];

  const slugMatchedSubcategory = allSubcategoryNames.find(
    (name) => toSlug(name) === resolvedParams.subcategory
  );
  const mappedSubcategoryFromStatic = getSubcategoryNameFromSlug(resolvedParams.subcategory);
  const mappedSubcategoryInCategory = mappedSubcategoryFromStatic
    ? allSubcategoryNames.find((name) => normalize(name) === normalize(mappedSubcategoryFromStatic))
    : undefined;

  const subcategoryName = slugMatchedSubcategory || mappedSubcategoryInCategory;

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
