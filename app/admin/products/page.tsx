"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductTable from "@/components/admin/ProductTable";
import { useAdminProducts } from "@/lib/hooks/useAdminProducts";

export default function ProductsPage() {
  const router = useRouter();
  const {
    products,
    loading,
    mutate: mutateProducts,
  } = useAdminProducts();

  // Refresh data when page becomes visible (user returns from edit page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        mutateProducts(undefined, { revalidate: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [mutateProducts]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      await mutateProducts(
        (current) => (current || []).filter((product) => product.id !== id),
        { revalidate: false }
      );
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-600 mt-1">Manage your product catalog</p>
      </div>

      <ProductTable products={products} onDelete={handleDelete} />
    </div>
  );
}

