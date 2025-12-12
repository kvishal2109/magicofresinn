import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/admin/auth";
import * as CategoriesStorage from "@/lib/supabase/categories";

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const metadata = await CategoriesStorage.getCategoriesMetadata();
    return NextResponse.json({ success: true, metadata });
  } catch (error: any) {
    console.error("Error fetching categories metadata:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories metadata" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const { type, categoryName, subcategoryName, imageUrl } = body;

    if (type === "category") {
      if (!categoryName) {
        return NextResponse.json(
          { error: "Category name is required" },
          { status: 400 }
        );
      }
      await CategoriesStorage.updateCategoryImage(categoryName, imageUrl || null);
    } else if (type === "subcategory") {
      if (!categoryName || !subcategoryName) {
        return NextResponse.json(
          { error: "Category name and subcategory name are required" },
          { status: 400 }
        );
      }
      await CategoriesStorage.updateSubcategoryImage(categoryName, subcategoryName, imageUrl || null);
    } else {
      return NextResponse.json(
        { error: "Invalid type. Must be 'category' or 'subcategory'" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating categories metadata:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update categories metadata" },
      { status: 500 }
    );
  }
}

