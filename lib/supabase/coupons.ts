import { Coupon } from "@/lib/data/coupons";
import { getSupabaseAdmin, isSupabaseConfigured } from "./client";

function rowToCoupon(row: any): Coupon {
  return {
    code: row.code,
    discountType: row.discount_type,
    discountValue: parseFloat(row.discount_value),
    minPurchase: row.min_purchase != null ? parseFloat(row.min_purchase) : undefined,
    maxDiscount: row.max_discount != null ? parseFloat(row.max_discount) : undefined,
    isActive: row.is_active ?? true,
  };
}

export async function getCouponsFromSupabase(): Promise<Coupon[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("code");
    if (error) {
      console.error("Error fetching coupons from Supabase:", error);
      return [];
    }
    return (data || []).map(rowToCoupon);
  } catch (e) {
    console.error("getCouponsFromSupabase:", e);
    return [];
  }
}

export async function getActiveCouponsFromSupabase(): Promise<Coupon[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("is_active", true)
      .order("code");
    if (error) {
      console.error("Error fetching active coupons:", error);
      return [];
    }
    return (data || []).map(rowToCoupon);
  } catch (e) {
    console.error("getActiveCouponsFromSupabase:", e);
    return [];
  }
}

export async function createCouponInSupabase(coupon: Omit<Coupon, "validFrom" | "validUntil">): Promise<{ id: string } | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getSupabaseAdmin();
    const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const { error } = await supabase.from("coupons").insert({
      id,
      code: coupon.code.toUpperCase().trim(),
      discount_type: coupon.discountType,
      discount_value: coupon.discountValue,
      min_purchase: coupon.minPurchase ?? null,
      max_discount: coupon.maxDiscount ?? null,
      is_active: coupon.isActive ?? true,
    });
    if (error) throw error;
    return { id };
  } catch (e) {
    console.error("createCouponInSupabase:", e);
    throw e;
  }
}

export async function updateCouponInSupabase(
  code: string,
  updates: Partial<Pick<Coupon, "discountType" | "discountValue" | "minPurchase" | "maxDiscount" | "isActive">>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = getSupabaseAdmin();
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.discountType != null) payload.discount_type = updates.discountType;
    if (updates.discountValue != null) payload.discount_value = updates.discountValue;
    if (updates.minPurchase != null) payload.min_purchase = updates.minPurchase;
    if (updates.maxDiscount != null) payload.max_discount = updates.maxDiscount;
    if (updates.isActive != null) payload.is_active = updates.isActive;
    const { error } = await supabase
      .from("coupons")
      .update(payload)
      .eq("code", code.toUpperCase());
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("updateCouponInSupabase:", e);
    throw e;
  }
}

export async function deleteCouponFromSupabase(code: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("coupons").delete().eq("code", code.toUpperCase());
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("deleteCouponFromSupabase:", e);
    throw e;
  }
}
