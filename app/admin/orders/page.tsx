"use client";

import OrderTable from "@/components/admin/OrderTable";
import { useAdminOrders } from "@/lib/hooks/useAdminOrders";

export default function OrdersPage() {
  const { orders, loading } = useAdminOrders();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">View and manage customer orders</p>
      </div>

      <OrderTable orders={orders} />
    </div>
  );
}

