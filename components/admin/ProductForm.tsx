"use client";

import { useState, useEffect, useMemo } from "react";
import { Product } from "@/types";
import ImageUpload from "./ImageUpload";
import { useAdminProducts } from "@/lib/hooks/useAdminProducts";
import toast from "react-hot-toast";

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
  const { products } = useAdminProducts();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    discount: "",
    image: "",
    images: [] as string[],
    category: "",
    subcategory: "",
    inStock: true,
    stock: "",
  });
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showCustomSubcategory, setShowCustomSubcategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [customSubcategoryInput, setCustomSubcategoryInput] = useState("");

  // Extract unique categories
  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    // If editing and current category is not in list, add it
    if (product?.category && !unique.includes(product.category)) {
      unique.push(product.category);
    }
    const preferredOrder = ["Wedding", "Jewellery", "Home Decor", "Furniture"];
    const ordered = preferredOrder.filter((cat) => unique.includes(cat));
    const remaining = unique.filter((cat) => !preferredOrder.includes(cat));
    return [...ordered, ...remaining];
  }, [products, product]);

  // Extract subcategories for selected category
  const subcategories = useMemo(() => {
    if (!formData.category) return [];
    const categoryProducts = products.filter((p) => p.category === formData.category);
    const unique = Array.from(
      new Set(categoryProducts.map((p) => p.subcategory).filter(Boolean))
    );
    // If editing and current subcategory is not in list, add it
    if (product?.subcategory && product.category === formData.category && !unique.includes(product.subcategory)) {
      unique.push(product.subcategory);
    }
    return unique.sort();
  }, [products, formData.category, product]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        originalPrice: product.originalPrice?.toString() || "",
        discount: product.discount?.toString() || "",
        image: product.image || "",
        images: product.images || [],
        category: product.category || "",
        subcategory: product.subcategory || "",
        inStock: product.inStock ?? true,
        stock: product.stock?.toString() || "",
      });
    }
  }, [product]);

  // Reset subcategory when category changes
  useEffect(() => {
    if (formData.category && !product) {
      setFormData((prev) => ({ ...prev, subcategory: "" }));
      setShowCustomSubcategory(false);
      setCustomSubcategoryInput("");
    }
  }, [formData.category, product]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const trimmedCategory = formData.category.trim();
      const trimmedSubcategory = formData.subcategory.trim();

      const submitData = {
        ...formData,
        category: trimmedCategory,
        subcategory: trimmedSubcategory || undefined,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        discount: formData.discount ? Number(formData.discount) : undefined,
        stock: formData.stock ? Number(formData.stock) : undefined,
        image: formData.images[0] || formData.image,
        images: formData.images.length > 0 ? formData.images : (formData.image ? [formData.image] : []),
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
          <div className="space-y-2">
            {!showCustomCategory ? (
              <select
                value={formData.category}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "__custom__") {
                    setShowCustomCategory(true);
                    setCustomCategoryInput("");
                    setFormData({ ...formData, category: "" });
                  } else {
                    setFormData({ ...formData, category: value });
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__custom__">+ Add New Category</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCategoryInput}
                  onChange={(e) => {
                    setCustomCategoryInput(e.target.value);
                    setFormData({ ...formData, category: e.target.value });
                  }}
                  placeholder="Enter new category name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomCategory(false);
                    setCustomCategoryInput("");
                    setFormData({ ...formData, category: "" });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subcategory
          </label>
          <div className="space-y-2">
            {!showCustomSubcategory ? (
              <select
                value={formData.subcategory || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "__custom__") {
                    setShowCustomSubcategory(true);
                    setCustomSubcategoryInput("");
                    setFormData({ ...formData, subcategory: "" });
                  } else {
                    setFormData({ ...formData, subcategory: value || "" });
                  }
                }}
                disabled={!formData.category}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">No subcategory</option>
                {subcategories.map((subcat) => (
                  <option key={subcat} value={subcat}>
                    {subcat}
                  </option>
                ))}
                {formData.category && <option value="__custom__">+ Add New Subcategory</option>}
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSubcategoryInput}
                  onChange={(e) => {
                    setCustomSubcategoryInput(e.target.value);
                    setFormData({ ...formData, subcategory: e.target.value });
                  }}
                  placeholder="Enter new subcategory name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomSubcategory(false);
                    setCustomSubcategoryInput("");
                    setFormData({ ...formData, subcategory: "" });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
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

