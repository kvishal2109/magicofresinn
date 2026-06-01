import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/admin/auth";
import {
  createCatalog,
  deleteCatalog,
  listCatalogs,
  updateCatalog,
} from "@/lib/supabase/catalog-db";

function revalidateCatalogPaths() {
  try {
    revalidatePath("/");
    revalidatePath("/api/catalog-tree");
    revalidatePath("/api/catalogs");
    revalidatePath("/admin/catalogs");
  } catch (e) {
    console.error("Revalidate error:", e);
  }
}

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const catalogs = await listCatalogs(true);
    return NextResponse.json({ success: true, catalogs });
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

    const catalog = await createCatalog({
      name: body.name,
      slug: body.slug,
      description: body.description,
      cover_image_url: body.cover_image_url,
      pdf_url: body.pdf_url,
      type: body.type,
      is_active: body.is_active,
      sort_order: body.sort_order,
    });

    revalidateCatalogPaths();
    return NextResponse.json({ success: true, catalog });
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

    const catalog = await updateCatalog(body.id, {
      name: body.name,
      slug: body.slug,
      description: body.description,
      cover_image_url: body.cover_image_url,
      pdf_url: body.pdf_url,
      type: body.type,
      is_active: body.is_active,
      sort_order: body.sort_order,
    });

    revalidateCatalogPaths();
    return NextResponse.json({ success: true, catalog });
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

    await deleteCatalog(id);
    revalidateCatalogPaths();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
