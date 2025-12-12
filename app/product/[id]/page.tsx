import { notFound } from "next/navigation";
import ProductDetailClient from "@/components/products/ProductDetailClient";
import { getProductById } from "@/lib/supabase/products";

export const revalidate = 300;

interface PageParams {
  id: string;
}

export default async function ProductDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const product = await getProductById(params.id);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
