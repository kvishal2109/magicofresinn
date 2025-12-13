import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/admin/auth";
import * as SupabaseProducts from "@/lib/supabase/products";
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
    if (body.inStock !== undefined) updates.inStock = Boolean(body.inStock);
    if (body.stock !== undefined) updates.stock = body.stock ? Number(body.stock) : undefined;
    if (body.catalogId !== undefined) updates.catalogId = body.catalogId;
    if (body.catalogName !== undefined) updates.catalogName = body.catalogName;

    await SupabaseProducts.updateProduct(id, updates);

    return NextResponse.json({ success: true });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

