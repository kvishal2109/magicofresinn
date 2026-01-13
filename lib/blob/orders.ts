import { Order, CheckoutFormData, CartItem } from "@/types";
import { getOrdersBlob, saveOrdersBlob } from "./storage";

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
    const orders = await getOrdersBlob();
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const newOrder: Order = {
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderNumber,
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
        product: item.product,
        quantity: item.quantity,
      })),
      subtotal: subtotal || totalAmount,
      discount: discount || 0,
      couponCode: couponCode || undefined,
      totalAmount,
      paymentStatus: "pending" as const,
      orderStatus: "pending" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    orders.push(newOrder);
    await saveOrdersBlob(orders);
    
    return newOrder.id;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const orders = await getOrdersBlob();
    const order = orders.find((o: any) => o.id === orderId);
    
    if (!order) {
      return null;
    }
    
    // Convert date strings to Date objects
    return {
      ...order,
      createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
      updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(),
    } as Order;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
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
    const orders = await getOrdersBlob();
    const order = orders.find((o: any) => o.id === orderId);
    
    if (!order) {
      throw new Error(`Order with ID "${orderId}" not found`);
    }
    
    order.paymentStatus = paymentStatus;
    if (paymentId) order.paymentId = paymentId;
    order.updatedAt = new Date();
    
    await saveOrdersBlob(orders);
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
    const orders = await getOrdersBlob();
    const order = orders.find((o: any) => o.id === orderId);
    
    if (!order) {
      throw new Error(`Order with ID "${orderId}" not found`);
    }
    
    order.paymentStatus = paymentStatus;
    order.verifiedAmount = verifiedAmount;
    order.verifiedAt = new Date();
    if (verifiedBy) order.verifiedBy = verifiedBy;
    order.updatedAt = new Date();
    
    await saveOrdersBlob(orders);
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
}

/**
 * Get all orders (admin function)
 */
export async function getAllOrders(): Promise<Order[]> {
  try {
    const orders = await getOrdersBlob();
    
    // Convert date strings to Date objects and sort by createdAt desc
    const parsedOrders = orders
      .map((o: any) => ({
        ...o,
        createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
        updatedAt: o.updatedAt ? new Date(o.updatedAt) : new Date(),
      }))
      .sort((a: Order, b: Order) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return parsedOrders as Order[];
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return [];
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
    const orders = await getOrdersBlob();
    const order = orders.find((o: any) => o.id === orderId);
    
    if (!order) {
      throw new Error(`Order with ID "${orderId}" not found`);
    }
    
    order.orderStatus = orderStatus;
    order.updatedAt = new Date();
    
    await saveOrdersBlob(orders);
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}

