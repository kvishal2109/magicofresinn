import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/admin/auth";
import {
  updateCouponInSupabase,
  deleteCouponFromSupabase,
} from "@/lib/supabase/coupons";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Coupons require Supabase." },
        { status: 400 }
      );
    }

    const { code } = await params;
    const body = await request.json();
    const updates: {
      discountType?: "percentage" | "fixed";
      discountValue?: number;
      minPurchase?: number;
      maxDiscount?: number;
      isActive?: boolean;
    } = {};
    if (body.discountType != null) updates.discountType = body.discountType;
    if (body.discountValue != null) updates.discountValue = Number(body.discountValue);
    if (body.minPurchase != null) updates.minPurchase = body.minPurchase === "" ? undefined : Number(body.minPurchase);
    if (body.maxDiscount != null) updates.maxDiscount = body.maxDiscount === "" ? undefined : Number(body.maxDiscount);
    if (typeof body.isActive === "boolean") updates.isActive = body.isActive;

    await updateCouponInSupabase(code, updates);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin PATCH coupon:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update coupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Coupons require Supabase." },
        { status: 400 }
      );
    }

    const { code } = await params;
    await deleteCouponFromSupabase(code);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin DELETE coupon:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
