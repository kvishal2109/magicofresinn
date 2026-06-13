import { NextResponse } from "next/server";
import { getProductSizeConfigurations } from "@/lib/supabase/sizes";
import { getProductById } from "@/lib/supabase/products";

export const revalidate = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const sizes = await getProductSizeConfigurations(id);
    return NextResponse.json({ success: true, sizes });
  } catch (error) {
    console.error("Error fetching product sizes:", error);
    return NextResponse.json({ error: "Failed to fetch product sizes" }, { status: 500 });
  }
}
