import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/supabase/orders";
import { CheckoutFormData, CartItem } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerData, items, totalAmount, subtotal, discount, couponCode } = body as {
      customerData: CheckoutFormData;
      items: CartItem[];
      totalAmount: number;
      subtotal?: number;
      discount?: number;
      couponCode?: string;
    };

    // Validate input
    if (!customerData || !items || items.length === 0 || !totalAmount) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const orderId = await createOrder(
      customerData,
      items,
      totalAmount,
      subtotal,
      discount,
      couponCode
    );

    return NextResponse.json({
      success: true,
      orderId,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

