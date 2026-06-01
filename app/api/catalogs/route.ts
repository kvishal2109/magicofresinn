import { NextResponse } from "next/server";
import { listCatalogs } from "@/lib/supabase/catalog-db";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const revalidate = 300;

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, catalogs: [] });
    }

    const catalogs = await listCatalogs(false);
    const active = catalogs.filter((c) => c.is_active);

    return NextResponse.json({
      success: true,
      catalogs: active.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        type: c.type,
        pdfFileName: c.pdf_url,
        coverImage: c.cover_image_url,
        isActive: c.is_active,
        sortOrder: c.sort_order,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching catalogs:", error);
    return NextResponse.json({ success: true, catalogs: [] });
  }
}
