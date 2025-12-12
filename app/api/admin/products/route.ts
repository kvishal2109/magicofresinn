import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/admin/auth";
import * as SupabaseProducts from "@/lib/supabase/products";
import { Product } from "@/types";

// Cache products API for 5 minutes
export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const products = await SupabaseProducts.getAllProducts();
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const {
      name,
      description,
      price,
      originalPrice,
      discount,
      image,
      images,
      category,
      subcategory,
      inStock,
      stock,
      catalogId,
      catalogName,
    } = body;

    // Validate required fields
    if (!name || !description || !price || !image || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const productData: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
      name,
      description,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      discount: discount ? Number(discount) : undefined,
      image,
      images: images || [],
      category,
      subcategory: subcategory || undefined,
      inStock: inStock !== undefined ? Boolean(inStock) : true,
      stock: stock ? Number(stock) : undefined,
      catalogId: catalogId || undefined,
      catalogName: catalogName || undefined,
    };

    const productId = await SupabaseProducts.createProduct(productData);

    return NextResponse.json({ success: true, productId });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}

