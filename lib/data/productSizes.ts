import { ProductSize } from "@/types";

export async function getProductSizes(product: {
  id: string;
}): Promise<ProductSize[] | undefined> {
  try {
    const response = await fetch(`/api/products/${encodeURIComponent(product.id)}/sizes`);
    if (!response.ok) return undefined;

    const data = await response.json();
    if (!data.success || !Array.isArray(data.sizes) || data.sizes.length === 0) {
      return undefined;
    }

    return data.sizes as ProductSize[];
  } catch (error) {
    console.error("Error fetching product sizes:", error);
    return undefined;
  }
}

export async function hasProductSizes(product: { id: string }): Promise<boolean> {
  const sizes = await getProductSizes(product);
  return !!sizes && sizes.length > 0;
}
