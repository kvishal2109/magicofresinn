import { NextResponse } from "next/server";
import { getProductsByCatalog } from "@/lib/supabase/products";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const products = await getProductsByCatalog(id);
    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("Error fetching products for catalog:", error);
    return NextResponse.json(
      { error: "Failed to fetch products for catalog" },
      { status: 500 }
    );
  }
}
