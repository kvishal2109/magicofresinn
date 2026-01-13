"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Product } from "@/types";
import ProductForm from "@/components/admin/ProductForm";
import { useAdminProducts } from "@/lib/hooks/useAdminProducts";
import toast from "react-hot-toast";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { mutate: mutateProducts } = useAdminProducts();

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`);
      const data = await response.json();
      setProduct(data.product);
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product");
      router.push("/admin/products");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Update failed");
      }

      // Invalidate SWR cache to refresh product list with fresh data
      await mutateProducts(undefined, { revalidate: true });
      
      // Force router refresh to clear Next.js cache
      router.refresh();
      
      toast.success("Product updated successfully");
      
      router.push("/admin/products");
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update product");
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-600 mt-1">Update product information</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <ProductForm product={product} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

