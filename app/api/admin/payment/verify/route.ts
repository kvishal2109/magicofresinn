import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentManually } from "@/lib/supabase/orders";
import { requireAuth } from "@/lib/admin/auth";

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const { orderId, verifiedAmount, paymentStatus } = body;

    if (!orderId || !verifiedAmount || !paymentStatus) {
      return NextResponse.json(
        { error: "orderId, verifiedAmount, and paymentStatus are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["paid", "partial", "failed"];
    if (!validStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: "Invalid payment status. Must be 'paid', 'partial', or 'failed'" },
        { status: 400 }
      );
    }

    await verifyPaymentManually(orderId, verifiedAmount, paymentStatus, "admin");

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}

