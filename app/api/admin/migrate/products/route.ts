import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/admin/auth";
import { migrateAllProducts } from "@/lib/migration/products";

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const body = await request.json().catch(() => ({}));
    const {
      migrateImages = true,
      skipExisting = true,
      batchSize = 10,
    } = body;

    console.log("Starting product migration from blob storage to Supabase...");
    console.log(`Options: migrateImages=${migrateImages}, skipExisting=${skipExisting}, batchSize=${batchSize}`);

    const result = await migrateAllProducts({
      migrateImages: Boolean(migrateImages),
      skipExisting: Boolean(skipExisting),
      batchSize: Number(batchSize) || 10,
    });

    console.log("Migration completed:", {
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      skipped: result.skipped,
    });

    return NextResponse.json({
      success: true,
      message: `Migration completed: ${result.successful} successful, ${result.failed} failed, ${result.skipped} skipped`,
      ...result,
    });
  } catch (error: any) {
    console.error("Error during migration:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to migrate products",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check migration status
 */
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    // Get counts from both sources
    let blobCount = 0;
    let supabaseCount = 0;
    
    try {
      const [blobProducts, supabaseProducts] = await Promise.all([
        import("@/lib/blob/products").then(m => m.getAllProducts()).catch(() => []),
        import("@/lib/supabase/products").then(m => m.getAllProducts()).catch(() => []),
      ]);
      blobCount = Array.isArray(blobProducts) ? blobProducts.length : 0;
      supabaseCount = Array.isArray(supabaseProducts) ? supabaseProducts.length : 0;
    } catch (error: any) {
      // If blob storage is not available, only get Supabase count
      if (error.message?.includes("Can't resolve '@vercel/blob'") || 
          error.message?.includes("Cannot find module")) {
        try {
          const supabaseProducts = await import("@/lib/supabase/products").then(m => m.getAllProducts());
          supabaseCount = Array.isArray(supabaseProducts) ? supabaseProducts.length : 0;
        } catch (e) {
          console.error("Error fetching Supabase products:", e);
        }
      } else {
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      blobStorage: {
        count: blobCount,
        available: blobCount >= 0, // Will be 0 if not available
      },
      supabase: {
        count: supabaseCount,
      },
      migrationNeeded: blobCount > supabaseCount,
    });
  } catch (error: any) {
    console.error("Error checking migration status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check migration status",
      },
      { status: 500 }
    );
  }
}

