import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/admin/auth";
import * as SupabaseProducts from "@/lib/supabase/products";

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Invalid updates array" },
        { status: 400 }
      );
    }

    // Validate each update
    for (const update of updates) {
      if (!update.productId || update.inStock === undefined) {
        return NextResponse.json(
          { error: "Each update must have productId and inStock" },
          { status: 400 }
        );
      }
    }

    await SupabaseProducts.bulkUpdateInventory(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error bulk updating inventory:", error);
    return NextResponse.json(
      { error: "Failed to bulk update inventory" },
      { status: 500 }
    );
  }
}

