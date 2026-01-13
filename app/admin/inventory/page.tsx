"use client";

import InventoryEditor from "@/components/admin/InventoryEditor";
import { useAdminProducts } from "@/lib/hooks/useAdminProducts";

// Inventory management page

export default function InventoryPage() {
  const {
    products,
    loading,
    mutate,
  } = useAdminProducts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-1">Update stock levels and availability</p>
      </div>

      <InventoryEditor
        products={products}
        onUpdate={async () => {
          await mutate();
        }}
      />
    </div>
  );
}

