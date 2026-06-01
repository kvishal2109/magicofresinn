"use client";

import { useState, useEffect, useMemo } from "react";
import { Product, Catalog } from "@/types";
import ImageUpload from "./ImageUpload";
import { useAdminProducts } from "@/lib/hooks/useAdminProducts";
import toast from "react-hot-toast";

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
}

interface CategoriesMetadata {
  categories: Record<string, { name: string; image?: string }>;
  subcategories: Record<string, { categoryName: string; subcategoryName: string; image?: string }>;
}

const normalize = (value: string) => value.trim().toLowerCase();

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
    catalogId: "",
    catalogName: "",
    inStock: true,
    stock: "",
  });
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showCustomSubcategory, setShowCustomSubcategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [customSubcategoryInput, setCustomSubcategoryInput] = useState("");
  const [categoriesMetadata, setCategoriesMetadata] = useState<CategoriesMetadata>({
    categories: {},
    subcategories: {},
  });
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);

  // Load admin categories metadata so empty categories/subcategories are available in the product form
  useEffect(() => {
    fetch("/api/admin/categories/metadata")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.metadata) {
          setCategoriesMetadata(data.metadata);
        }
      })
      .catch((error) => {
        console.warn("Could not fetch categories metadata for product form:", error);
      });
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/catalogs")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data?.success && Array.isArray(data.catalogs)) {
          setCatalogs(data.catalogs);
        }
      })
      .catch((error) => {
        console.warn("Could not fetch catalogs for product form:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!formData.catalogId || formData.catalogName) return;
    const match = catalogs.find((catalog) => catalog.id === formData.catalogId);
    if (match) {
      setFormData((prev) => ({ ...prev, catalogName: match.name }));
    }
  }, [catalogs, formData.catalogId, formData.catalogName]);

  // Extract unique categories
  const categories = useMemo(() => {
    const categoryMap = new Map<string, string>();
    const addCategory = (name?: string | null) => {
      if (!name) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      const key = normalize(trimmed);
      if (!categoryMap.has(key)) {
        categoryMap.set(key, trimmed);
      }
    };

    products.forEach((p) => addCategory(p.category));
    Object.keys(categoriesMetadata.categories || {}).forEach((cat) => addCategory(cat));
    Object.values(categoriesMetadata.subcategories || {}).forEach((sub) =>
      addCategory(sub.categoryName)
    );
    if (product?.category) addCategory(product.category);

    return Array.from(categoryMap.values()).sort((a, b) => a.localeCompare(b));
  }, [products, product, categoriesMetadata]);

  // Extract subcategories for selected category
  const subcategories = useMemo(() => {
    if (!formData.category) return [];
    const subcategoryMap = new Map<string, string>();
    const addSubcategory = (name?: string | null) => {
      if (!name) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      const key = normalize(trimmed);
      if (!subcategoryMap.has(key)) {
        subcategoryMap.set(key, trimmed);
      }
    };

    products
      .filter((p) => normalize(p.category) === normalize(formData.category))
      .forEach((p) => addSubcategory(p.subcategory));

    Object.values(categoriesMetadata.subcategories || {})
      .filter((sub) => normalize(sub.categoryName) === normalize(formData.category))
      .forEach((sub) => addSubcategory(sub.subcategoryName));

    if (
      product?.subcategory &&
      product.category &&
      normalize(product.category) === normalize(formData.category)
    ) {
      addSubcategory(product.subcategory);
    }

    return Array.from(subcategoryMap.values()).sort((a, b) => a.localeCompare(b));
  }, [products, formData.category, product, categoriesMetadata]);

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
        catalogId: product.catalogId || "",
        catalogName: product.catalogName || "",
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

  const handleCatalogChange = (value: string) => {
    const selectedCatalog = catalogs.find((catalog) => catalog.id === value);
    const name = value ? selectedCatalog?.name || "" : "";
    setFormData((prev) => ({
      ...prev,
      catalogId: value,
      catalogName: name,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const trimmedCategory = formData.category.trim();
      const trimmedSubcategory = formData.subcategory.trim();
      const trimmedCatalogId = formData.catalogId ? formData.catalogId.trim() : "";
      const selectedCatalog =
        trimmedCatalogId && catalogs.length
          ? catalogs.find((catalog) => catalog.id === trimmedCatalogId)
          : undefined;
      const submitCatalogName = trimmedCatalogId
        ? selectedCatalog?.name || formData.catalogName || undefined
        : undefined;

      // Validate that at least one image is provided
      const primaryImage = formData.images[0] || formData.image;
      if (!primaryImage || primaryImage.trim() === "") {
        toast.error("Please upload at least one product image");
        setLoading(false);
        return;
      }

      // Ensure price is always a valid number
      const priceValue = formData.price ? Number(formData.price) : 0;
      if (isNaN(priceValue) || priceValue < 0) {
        toast.error("Please enter a valid price");
        setLoading(false);
        return;
      }

      const submitData = {
        ...formData,
        category: trimmedCategory,
        subcategory: trimmedSubcategory || undefined,
        catalogId: trimmedCatalogId || undefined,
        catalogName: submitCatalogName,
        price: priceValue,
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        discount: formData.discount ? Number(formData.discount) : undefined,
        stock: formData.stock ? Number(formData.stock) : undefined,
        image: primaryImage,
        images: formData.images.length > 0 ? formData.images : (formData.image ? [formData.image] : []),
      };

      console.log("Submitting product data:", submitData);

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
            Catalog
          </label>
          <select
            value={formData.catalogId}
            onChange={(e) => handleCatalogChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Assign to catalog (optional)</option>
            {catalogs.map((catalog) => (
              <option key={catalog.id} value={catalog.id}>
                {catalog.name}
              </option>
            ))}
          </select>
          {catalogs.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">Loading catalogs…</p>
          )}
          {formData.catalogId &&
            !catalogs.find((catalog) => catalog.id === formData.catalogId) &&
            formData.catalogName && (
              <p className="text-xs text-gray-500 mt-1">
                Using catalog name: {formData.catalogName}
              </p>
            )}
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

