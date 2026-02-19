import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/admin/auth";
import {
  getCouponsFromSupabase,
  getActiveCouponsFromSupabase,
  createCouponInSupabase,
} from "@/lib/supabase/coupons";
import { getActiveCoupons } from "@/lib/data/coupons";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    let list = getActiveCoupons(); // fallback: static list from code
    try {
      const fromDb = await getCouponsFromSupabase();
      if (fromDb.length > 0) list = fromDb;
    } catch (e) {
      console.warn("Admin GET coupons: Supabase failed, using static list.", e);
    }
    return NextResponse.json({ success: true, coupons: list });
  } catch (error: any) {
    console.error("Admin GET coupons:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Coupons require Supabase. Add the coupons table and configure Supabase." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const code = (body.code as string)?.toUpperCase()?.trim();
    const discountType = body.discountType as "percentage" | "fixed";
    const discountValue = Number(body.discountValue);
    const minPurchase = body.minPurchase != null ? Number(body.minPurchase) : undefined;
    const maxDiscount = body.maxDiscount != null ? Number(body.maxDiscount) : undefined;

    if (!code || !discountType || Number.isNaN(discountValue)) {
      return NextResponse.json(
        { error: "code, discountType, and discountValue are required" },
        { status: 400 }
      );
    }
    if (discountType !== "percentage" && discountType !== "fixed") {
      return NextResponse.json({ error: "discountType must be percentage or fixed" }, { status: 400 });
    }

    const id = await createCouponInSupabase({
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      isActive: true,
    });
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("Admin POST coupon:", error);
    const msg = error?.message || "Failed to create coupon";
    const isConflict = msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate");
    return NextResponse.json(
      { error: isConflict ? "A coupon with this code already exists." : msg },
      { status: isConflict ? 409 : 500 }
    );
  }
}
