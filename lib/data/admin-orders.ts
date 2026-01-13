import { Order } from "@/types";
import fs from "fs";
import path from "path";

const ORDERS_FILE = path.join(process.cwd(), "data", "admin-orders.json");

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read orders from JSON file
export function readOrdersFromFile(): Order[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(ORDERS_FILE)) {
      return [];
    }
    const fileContent = fs.readFileSync(ORDERS_FILE, "utf-8");
    const orders = JSON.parse(fileContent);
    // Convert date strings back to Date objects
    return orders.map((o: any) => ({
      ...o,
      createdAt: new Date(o.createdAt),
      updatedAt: new Date(o.updatedAt),
    }));
  } catch (error) {
    console.error("Error reading orders file:", error);
    return [];
  }
}

// Write orders to JSON file
export function writeOrdersToFile(orders: Order[]): void {
  try {
    ensureDataDir();
    // Convert Date objects to ISO strings for JSON
    const ordersToSave = orders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }));
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(ordersToSave, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing orders file:", error);
    throw error;
  }
}

// Get all orders
export function getAllOrders(): Order[] {
  return readOrdersFromFile();
}

// Get order by ID
export function getOrderById(orderId: string): Order | null {
  const orders = readOrdersFromFile();
  return orders.find((o) => o.id === orderId) || null;
}

// Update order status
export function updateOrderStatus(
  orderId: string,
  orderStatus: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
): void {
  const orders = readOrdersFromFile();
  const order = orders.find((o) => o.id === orderId);
  
  if (!order) {
    throw new Error(`Order with ID "${orderId}" not found`);
  }
  
  order.orderStatus = orderStatus;
  order.updatedAt = new Date();
  
  writeOrdersToFile(orders);
}

// Create order (for when orders are placed)
export function createOrder(orderData: Omit<Order, "id" | "createdAt" | "updatedAt">): string {
  const orders = readOrdersFromFile();
  const newOrder: Order = {
    ...orderData,
    id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  orders.push(newOrder);
  writeOrdersToFile(orders);
  return newOrder.id;
}

