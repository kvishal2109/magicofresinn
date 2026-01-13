"use client";

import PriceBulkEditor from "@/components/admin/PriceBulkEditor";
import { useAdminProducts } from "@/lib/hooks/useAdminProducts";

export default function PricesPage() {
  const {
    products,
    loading,
    mutate,
  } = useAdminProducts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Price Management</h1>
        <p className="text-gray-600 mt-1">Bulk update product prices</p>
      </div>

      <PriceBulkEditor
        products={products}
        onUpdate={async () => {
          await mutate();
        }}
      />
    </div>
  );
}

