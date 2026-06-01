import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/admin/auth";
import {
  migrateLegacyCatalogData,
  seedDefaultCatalogsFromStatic,
} from "@/lib/supabase/migrate-catalog-v2";

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const body = await request.json().catch(() => ({}));
    const seedCatalogs = body.seedCatalogs !== false;

    let catalogsSeeded = 0;
    if (seedCatalogs) {
      catalogsSeeded = await seedDefaultCatalogsFromStatic();
    }

    const result = await migrateLegacyCatalogData();

    return NextResponse.json({
      success: true,
      message: "Catalog migration completed",
      catalogsSeeded,
      ...result,
    });
  } catch (error: any) {
    console.error("Catalog migration error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Migration failed" },
      { status: 500 }
    );
  }
}
