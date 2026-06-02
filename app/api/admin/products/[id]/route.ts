import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/admin/auth";
import * as SupabaseProducts from "@/lib/supabase/products";
import { revalidateStorefrontCatalog } from "@/lib/revalidate-catalog";
import { Product } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const product = await SupabaseProducts.getProductById(id);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();

    console.log("Update request body:", JSON.stringify(body, null, 2));

    const updates: Partial<Omit<Product, "id" | "createdAt">> = {};
    
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.price !== undefined && body.price !== null && body.price !== "") {
      const priceNum = Number(body.price);
      if (!isNaN(priceNum) && priceNum >= 0) {
        updates.price = priceNum;
        console.log("Setting price to:", priceNum);
      } else {
        console.warn("Invalid price value:", body.price);
      }
    } else {
      console.log("Price not provided or empty");
    }
    if (body.originalPrice !== undefined && body.originalPrice !== null && body.originalPrice !== "") {
      const originalPriceNum = Number(body.originalPrice);
      if (!isNaN(originalPriceNum) && originalPriceNum >= 0) {
        updates.originalPrice = originalPriceNum;
      }
    }
    if (body.discount !== undefined && body.discount !== null && body.discount !== "") {
      const discountNum = Number(body.discount);
      if (!isNaN(discountNum) && discountNum >= 0) {
        updates.discount = discountNum;
      }
    }
    if (body.image !== undefined) updates.image = body.image;
    if (body.images !== undefined) updates.images = body.images;
    if (body.category !== undefined) updates.category = body.category;
    if (body.subcategory !== undefined) updates.subcategory = body.subcategory;
    if (body.categoryId !== undefined) updates.categoryId = body.categoryId;
    if (body.subcategoryId !== undefined) updates.subcategoryId = body.subcategoryId;
    if (body.inStock !== undefined) updates.inStock = Boolean(body.inStock);
    if (body.stock !== undefined) updates.stock = body.stock ? Number(body.stock) : undefined;

    await SupabaseProducts.updateProduct(id, updates);

    try {
      revalidatePath("/api/admin/products");
      revalidatePath(`/api/admin/products/${id}`);
      revalidatePath("/admin/products");
      revalidatePath(`/admin/products/${id}/edit`);
      await revalidateStorefrontCatalog(id);
      console.log("Cache revalidated for product:", id);
    } catch (error) {
      console.error("Error revalidating cache:", error);
    }

    // Create response headers only when needed
    const responseHeaders = new Headers();
    responseHeaders.set('Cache-Control', 'no-store, must-revalidate');
    
    return NextResponse.json({ success: true }, { headers: responseHeaders });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const { id } = await params;
    await SupabaseProducts.deleteProduct(id);

    try {
      revalidatePath("/api/admin/products");
      revalidatePath("/admin/products");
      await revalidateStorefrontCatalog(id);
    } catch (error) {
      console.error("Error revalidating cache after delete:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

