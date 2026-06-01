import { NextRequest, NextResponse } from "next/server";
import { getCatalogById } from "@/lib/supabase/catalog-db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const catalog = await getCatalogById(id);

    if (!catalog) {
      return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      catalog: {
        id: catalog.id,
        name: catalog.name,
        slug: catalog.slug,
        description: catalog.description,
        type: catalog.type,
        pdfFileName: catalog.pdf_url,
        coverImage: catalog.cover_image_url,
        isActive: catalog.is_active,
        sortOrder: catalog.sort_order,
        createdAt: catalog.created_at,
        updatedAt: catalog.updated_at,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
