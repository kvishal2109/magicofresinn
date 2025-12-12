import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrderPaymentStatus } from "@/lib/supabase/orders";
import { uploadImage } from "@/lib/cloudinary/client";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const orderId = formData.get("orderId") as string;
    const utrNumber = formData.get("utrNumber") as string | null;
    const paymentProof = formData.get("paymentProof") as File | null;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    if (!utrNumber || !utrNumber.trim()) {
      return NextResponse.json(
        { error: "UTR number is required" },
        { status: 400 }
      );
    }

    // Get order to verify it exists
    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if payment already submitted
    if (order.paymentStatus === "pending_verification" || order.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "Payment details already submitted for this order" },
        { status: 400 }
      );
    }

    let paymentProofUrl: string | undefined;
    if (paymentProof) {
      try {
        const { url } = await uploadImage(paymentProof, "payment-proofs");
        paymentProofUrl = url;
      } catch (error) {
        console.error("Error uploading payment proof:", error);
      }
    }

    await updateOrderPaymentStatus(orderId, "pending_verification", utrNumber);

    const supabase = getSupabaseAdmin();
    const updateData: any = {
      utr_number: utrNumber.trim(),
      payment_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (paymentProofUrl) {
      updateData.payment_proof_url = paymentProofUrl;
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error("Error updating order payment details:", updateError);
    }

    return NextResponse.json({
      success: true,
      message: "Payment details submitted successfully",
      orderId,
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    return NextResponse.json(
      { error: "Failed to submit payment details" },
      { status: 500 }
    );
  }
}

