import { NextResponse } from "next/server";
import { getActiveCoupons } from "@/lib/data/coupons";
import { getActiveCouponsFromSupabase } from "@/lib/supabase/coupons";

// Public API: list active coupons (Supabase first, then fallback to static).
export const revalidate = 60;

export async function GET() {
  let list = getActiveCoupons();
  try {
    const fromDb = await getActiveCouponsFromSupabase();
    if (fromDb.length > 0) list = fromDb;
  } catch (error) {
    console.warn("Coupons: Supabase unreachable (e.g. paused), using static list.", error);
  }
  return NextResponse.json({ success: true, coupons: list });
}
