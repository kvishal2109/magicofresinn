import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/admin/auth";
import {
  createSubcategory,
  deleteSubcategory,
  listSubcategories,
  updateSubcategory,
} from "@/lib/supabase/catalog-db";

function revalidateSubcategoryPaths() {
  try {
    revalidatePath("/");
    revalidatePath("/api/catalog-tree");
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

    const categoryId = new URL(request.url).searchParams.get("categoryId") || undefined;
    const subcategories = await listSubcategories(categoryId, true);
    return NextResponse.json({ success: true, subcategories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    if (!body.name?.trim() || !body.category_id) {
      return NextResponse.json(
        { error: "name and category_id are required" },
        { status: 400 }
      );
    }

    const subcategory = await createSubcategory({
      category_id: body.category_id,
      name: body.name,
      slug: body.slug,
      description: body.description,
      image_url: body.image_url,
      sort_order: body.sort_order,
      is_active: body.is_active,
    });

    revalidateSubcategoryPaths();
    return NextResponse.json({ success: true, subcategory });
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

    const subcategory = await updateSubcategory(body.id, {
      name: body.name,
      slug: body.slug,
      category_id: body.category_id,
      description: body.description,
      image_url: body.image_url,
      sort_order: body.sort_order,
      is_active: body.is_active,
    });

    revalidateSubcategoryPaths();
    return NextResponse.json({ success: true, subcategory });
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

    await deleteSubcategory(id);
    revalidateSubcategoryPaths();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
