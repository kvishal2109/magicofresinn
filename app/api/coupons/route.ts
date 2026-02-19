import { NextResponse } from "next/server";
import { getActiveCoupons } from "@/lib/data/coupons";
import { getActiveCouponsFromSupabase } from "@/lib/supabase/coupons";

// Public API: list active coupons (Supabase first, then fallback to static).
export const revalidate = 60;

export async function GET() {
  try {
    const fromDb = await getActiveCouponsFromSupabase();
    const list = fromDb.length > 0 ? fromDb : getActiveCoupons();
    return NextResponse.json({ success: true, coupons: list });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}
