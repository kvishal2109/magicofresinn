import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/admin/auth";
import * as SupabaseProducts from "@/lib/supabase/products";
import * as CategoriesStorage from "@/lib/supabase/categories";

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const categories = await SupabaseProducts.getAllCategories();
    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const {
      oldCategory,
      newCategory,
      categoryName,
      oldSubcategory,
      newSubcategory,
    } = body;

    if (oldCategory || newCategory) {
      if (!oldCategory || !newCategory) {
        return NextResponse.json(
          { error: "oldCategory and newCategory are required" },
          { status: 400 }
        );
      }

      if (oldCategory === newCategory) {
        return NextResponse.json(
          { error: "Old and new category names cannot be the same" },
          { status: 400 }
        );
      }

      await Promise.all([
        SupabaseProducts.bulkUpdateCategory(oldCategory, newCategory),
        CategoriesStorage.renameCategoryMetadata(oldCategory, newCategory),
      ]);
    } else {
      if (!categoryName || !oldSubcategory || !newSubcategory) {
        return NextResponse.json(
          { error: "categoryName, oldSubcategory and newSubcategory are required" },
          { status: 400 }
        );
      }

      if (oldSubcategory === newSubcategory) {
        return NextResponse.json(
          { error: "Old and new subcategory names cannot be the same" },
          { status: 400 }
        );
      }

      // Products first (source of truth), then metadata — avoids inconsistent state if metadata fails alone
      await SupabaseProducts.bulkUpdateSubcategory(
        categoryName,
        oldSubcategory,
        newSubcategory
      );
      await CategoriesStorage.renameSubcategoryMetadata(
        categoryName,
        oldSubcategory,
        newSubcategory
      );
    }

    try {
      revalidatePath("/");
      revalidatePath("/api/categories");
      revalidatePath("/products/[category]/[subcategory]", "page");
      revalidatePath("/admin/categories");
      revalidatePath("/admin/products");
    } catch (revalidateError) {
      console.error("Error revalidating category pages:", revalidateError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating category:", error);
    const msg =
      error?.message ||
      error?.error_description ||
      (typeof error === "string" ? error : null) ||
      "Failed to update category";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    if (!category) {
      return NextResponse.json(
        { error: "Category parameter is required" },
        { status: 400 }
      );
    }

    await Promise.all([
      SupabaseProducts.deleteCategory(category),
      CategoriesStorage.deleteCategoryMetadata(category),
    ]);

    try {
      revalidatePath("/");
      revalidatePath("/api/categories");
      revalidatePath("/products/[category]/[subcategory]", "page");
    } catch (revalidateError) {
      console.error("Error revalidating category pages:", revalidateError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}

