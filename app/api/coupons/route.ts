import { NextResponse } from "next/server";
import { getActiveCoupons } from "@/lib/data/coupons";

// Public API: list active coupons for banners/checkout.
// When admin panel adds coupon CRUD, switch this to read from DB and keep the same response shape.
export const revalidate = 60;

export async function GET() {
  try {
    const coupons = getActiveCoupons();
    return NextResponse.json({ success: true, coupons });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}
