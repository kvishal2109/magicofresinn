"use client";

import { useRouter } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import toast from "react-hot-toast";

export default function NewProductPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to create product (${response.status})`;
        throw new Error(errorMessage);
      }

      toast.success("Product created successfully");
      router.push("/admin/products");
    } catch (error) {
      console.error("Create error:", error);
      toast.error("Failed to create product");
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Product</h1>
        <p className="text-gray-600 mt-1">Add a new product to your catalog</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <ProductForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

