import { Order, CheckoutFormData, CartItem } from "@/types";
import { getSupabaseAdmin } from "./client";

/**
 * Get all orders from Supabase
 */
export async function getAllOrders(): Promise<Order[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching orders from Supabase:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      orderNumber: row.order_number,
      customer: row.customer,
      items: row.items,
      subtotal: parseFloat(row.subtotal || row.total_amount),
      discount: parseFloat(row.discount || 0),
      couponCode: row.coupon_code || undefined,
      totalAmount: parseFloat(row.total_amount),
      paymentStatus: row.payment_status || 'pending',
      orderStatus: row.order_status || 'pending',
      paymentId: row.payment_id || undefined,
      utrNumber: row.utr_number || undefined,
      paymentProofUrl: row.payment_proof_url || undefined,
      paymentSubmittedAt: row.payment_submitted_at ? new Date(row.payment_submitted_at) : undefined,
      verifiedAmount: row.verified_amount ? parseFloat(row.verified_amount) : undefined,
      verifiedAt: row.verified_at ? new Date(row.verified_at) : undefined,
      verifiedBy: row.verified_by || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  } catch (error) {
    console.error("Error fetching orders from Supabase:", error);
    return [];
  }
}

/**
 * Get order by ID
 */
export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      orderNumber: data.order_number,
      customer: data.customer,
      items: data.items,
      subtotal: parseFloat(data.subtotal || data.total_amount),
      discount: parseFloat(data.discount || 0),
      couponCode: data.coupon_code || undefined,
      totalAmount: parseFloat(data.total_amount),
      paymentStatus: data.payment_status || 'pending',
      orderStatus: data.order_status || 'pending',
      paymentId: data.payment_id || undefined,
      utrNumber: data.utr_number || undefined,
      paymentProofUrl: data.payment_proof_url || undefined,
      paymentSubmittedAt: data.payment_submitted_at ? new Date(data.payment_submitted_at) : undefined,
      verifiedAmount: data.verified_amount ? parseFloat(data.verified_amount) : undefined,
      verifiedAt: data.verified_at ? new Date(data.verified_at) : undefined,
      verifiedBy: data.verified_by || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return null;
  }
}

/**
 * Create a new order
 */
export async function createOrder(
  customerData: CheckoutFormData,
  items: CartItem[],
  totalAmount: number,
  subtotal?: number,
  discount?: number,
  couponCode?: string
): Promise<string> {
  try {
    const supabase = getSupabaseAdmin();
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const { error } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        order_number: orderNumber,
        customer: {
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email,
          address: {
            street: customerData.street,
            city: customerData.city,
            state: customerData.state,
            pincode: customerData.pincode,
          },
        },
        items: items.map((item) => ({
          productId: item.productId,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            image: item.product.image,
          },
          quantity: item.quantity,
        })),
        subtotal: subtotal || totalAmount,
        discount: discount || 0,
        coupon_code: couponCode || null,
        total_amount: totalAmount,
        payment_status: 'pending',
        order_status: 'pending',
      });

    if (error) {
      throw error;
    }

    return orderId;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

/**
 * Update order payment status
 */
export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: "pending" | "pending_verification" | "paid" | "partial" | "failed",
  paymentId?: string
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const updateData: any = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    };

    if (paymentId) updateData.payment_id = paymentId;

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error updating order payment status:", error);
    throw error;
  }
}

/**
 * Verify payment manually (admin function)
 */
export async function verifyPaymentManually(
  orderId: string,
  verifiedAmount: number,
  paymentStatus: "paid" | "partial" | "failed",
  verifiedBy?: string
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        verified_amount: verifiedAmount,
        verified_at: new Date().toISOString(),
        verified_by: verifiedBy || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
}

/**
 * Update order status (admin function)
 */
export async function updateOrderStatus(
  orderId: string,
  orderStatus: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('orders')
      .update({
        order_status: orderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}

/**
 * Delete order
 */
export async function deleteOrder(orderId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
}

