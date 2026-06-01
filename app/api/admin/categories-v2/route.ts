import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/admin/auth";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/lib/supabase/catalog-db";

function revalidateCategoryPaths() {
  try {
    revalidatePath("/");
    revalidatePath("/api/catalog-tree");
    revalidatePath("/api/categories");
    revalidatePath("/admin/categories");
    revalidatePath("/products/[category]/[subcategory]", "page");
  } catch (e) {
    console.error("Revalidate error:", e);
  }
}

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const categories = await listCategories(true);
    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const category = await createCategory({
      name: body.name,
      slug: body.slug,
      catalog_id: body.catalog_id ?? null,
      description: body.description,
      image_url: body.image_url,
      sort_order: body.sort_order,
      is_active: body.is_active,
    });

    revalidateCategoryPaths();
    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const category = await updateCategory(body.id, {
      name: body.name,
      slug: body.slug,
      catalog_id: body.catalog_id,
      description: body.description,
      image_url: body.image_url,
      sort_order: body.sort_order,
      is_active: body.is_active,
    });

    revalidateCategoryPaths();
    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await deleteCategory(id);
    revalidateCategoryPaths();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
