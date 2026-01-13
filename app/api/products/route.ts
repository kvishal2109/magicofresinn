import { NextResponse } from "next/server";
import { getAllProducts, getProductsByCategory } from "@/lib/supabase/products";

// Cache public products API for 5 minutes
export const revalidate = 300;

export async function GET() {
  try {
    const products = await getAllProducts();
    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

