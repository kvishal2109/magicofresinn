import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/admin/auth";
import * as SupabaseProducts from "@/lib/supabase/products";
import { Product } from "@/types";

// Shorter cache for admin - 30 seconds (admin needs fresh data)

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;
    
    const products = await SupabaseProducts.getAllProducts();
    
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, must-revalidate, max-age=0');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    return NextResponse.json({ success: true, products }, { headers });
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
    const missingFields: string[] = [];
    if (!name || name.trim() === "") missingFields.push("name");
    if (!description || description.trim() === "") missingFields.push("description");
    if (!price || price === "" || isNaN(Number(price))) missingFields.push("price");
    if (!image || image.trim() === "") missingFields.push("image");
    if (!category || category.trim() === "") missingFields.push("category");
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
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

    // Revalidate cache to show new product immediately
    try {
      revalidatePath("/api/admin/products");
      revalidatePath("/api/products");
      revalidatePath("/");
      revalidatePath("/admin/products");
      console.log("Cache revalidated after product creation");
    } catch (error) {
      console.error("Error revalidating cache:", error);
    }

    return NextResponse.json({ success: true, productId });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}

