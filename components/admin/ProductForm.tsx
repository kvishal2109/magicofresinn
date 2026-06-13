"use client";

import { useState, useEffect } from "react";
import { Product } from "@/types";
import ImageUpload from "./ImageUpload";
import toast from "react-hot-toast";
import type { DbCategory, DbSubcategory } from "@/lib/supabase/catalog-types";

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
}

export default function ProductForm({
  product,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    discount: "",
    image: "",
    images: [] as string[],
    categoryId: "",
    subcategoryId: "",
    inStock: true,
    stock: "",
  });
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [subcategories, setSubcategories] = useState<DbSubcategory[]>([]);

  useEffect(() => {
    fetch("/api/admin/categories-v2")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.categories)) {
          setCategories(data.categories.filter((c: DbCategory) => c.is_active));
        }
      })
      .catch((error) => {
        console.warn("Could not fetch categories for product form:", error);
      });
  }, []);

  useEffect(() => {
    if (!formData.categoryId) {
      setSubcategories([]);
      return;
    }

    fetch(`/api/admin/subcategories?categoryId=${formData.categoryId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.subcategories)) {
          setSubcategories(data.subcategories.filter((s: DbSubcategory) => s.is_active));
        }
      })
      .catch((error) => {
        console.warn("Could not fetch subcategories for product form:", error);
      });
  }, [formData.categoryId]);

  useEffect(() => {
    if (!product) return;

    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      originalPrice: product.originalPrice?.toString() || "",
      discount: product.discount?.toString() || "",
      image: product.image || "",
      images: product.images || [],
      categoryId: product.categoryId || "",
      subcategoryId: product.subcategoryId || "",
      inStock: product.inStock ?? true,
      stock: product.stock?.toString() || "",
    });
  }, [product]);

  const formatNumber = (value: number) => {
    if (!Number.isFinite(value)) return "";
    const rounded = Math.round(value * 100) / 100;
    return rounded.toString();
  };

  const handlePriceFieldChange = (
    field: "price" | "originalPrice" | "discount",
    value: string
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      const price = parseFloat(updated.price);
      const original = parseFloat(updated.originalPrice);
      const discount = parseFloat(updated.discount);

      const hasPrice = !Number.isNaN(price);
      const hasOriginal = !Number.isNaN(original);
      const hasDiscount = !Number.isNaN(discount);

      if (field !== "discount" && hasPrice && hasOriginal && original > 0) {
        const calculatedDiscount = ((original - price) / original) * 100;
        updated.discount = formatNumber(calculatedDiscount);
      } else if (field !== "originalPrice" && hasPrice && hasDiscount && discount < 100) {
        const calculatedOriginal = price / (1 - discount / 100);
        updated.originalPrice = formatNumber(calculatedOriginal);
      } else if (field !== "price" && hasOriginal && hasDiscount) {
        const calculatedPrice = original * (1 - discount / 100);
        updated.price = formatNumber(calculatedPrice);
      }

      return updated;
    });
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryId,
      subcategoryId: "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedCategory = categories.find((c) => c.id === formData.categoryId);
      const selectedSubcategory = subcategories.find((s) => s.id === formData.subcategoryId);

      if (!formData.categoryId || !selectedCategory) {
        toast.error("Please select a category");
        setLoading(false);
        return;
      }

      if (!formData.subcategoryId || !selectedSubcategory) {
        toast.error("Please select a subcategory");
        setLoading(false);
        return;
      }

      const primaryImage = formData.images[0] || formData.image;
      if (!primaryImage || primaryImage.trim() === "") {
        toast.error("Please upload at least one product image");
        setLoading(false);
        return;
      }

      const priceValue = formData.price ? Number(formData.price) : 0;
      if (isNaN(priceValue) || priceValue < 0) {
        toast.error("Please enter a valid price");
        setLoading(false);
        return;
      }

      const submitData = {
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId,
        subcategoryId: formData.subcategoryId,
        price: priceValue,
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        discount: formData.discount ? Number(formData.discount) : undefined,
        stock: formData.stock ? Number(formData.stock) : undefined,
        inStock: formData.inStock,
        image: primaryImage,
        images:
          formData.images.length > 0
            ? formData.images
            : formData.image
              ? [formData.image]
              : [],
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {categories.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">
              No categories yet. Add them from Admin → Categories.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subcategory *
          </label>
          <select
            value={formData.subcategoryId || ""}
            onChange={(e) =>
              setFormData({ ...formData, subcategoryId: e.target.value || "" })
            }
            disabled={!formData.categoryId}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select subcategory</option>
            {subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (₹) *
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => handlePriceFieldChange("price", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Original Price (₹)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.originalPrice}
            onChange={(e) => handlePriceFieldChange("originalPrice", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Discount (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.discount}
            onChange={(e) => handlePriceFieldChange("discount", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock Quantity
          </label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            In Stock
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.inStock}
              onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-700">Product is in stock</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Images *
        </label>
        <ImageUpload
          value={formData.images}
          onChange={(urls) => setFormData({ ...formData, images: urls })}
          multiple
          maxImages={10}
        />
      </div>

      <div className="flex justify-end space-x-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Saving..." : product ? "Update Product" : "Create Product"}
        </button>
      </div>
    </form>
  );
}
