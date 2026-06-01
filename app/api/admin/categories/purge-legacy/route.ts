import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/admin/auth";
import { purgeLegacyCatalogFromDatabase } from "@/lib/supabase/purge-legacy-catalog";

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const result = await purgeLegacyCatalogFromDatabase();

    revalidatePath("/");
    revalidatePath("/products/[category]/[subcategory]", "page");

    return NextResponse.json({
      success: true,
      message: `Removed ${result.deletedProducts} legacy products and ${result.deletedMetadataRows} metadata rows.`,
      ...result,
    });
  } catch (error: any) {
    console.error("Error purging legacy catalog:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to purge legacy catalog" },
      { status: 500 }
    );
  }
}
