"use client";

import { useState, useMemo } from "react";
import { Product } from "@/types";
import { Package } from "lucide-react";
import toast from "react-hot-toast";

interface InventoryEditorProps {
  products: Product[];
  onUpdate?: () => Promise<void> | void;
}

export default function InventoryEditor({
  products,
  onUpdate,
}: InventoryEditorProps) {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [stockUpdates, setStockUpdates] = useState<Record<string, { stock?: number; inStock: boolean }>>({});
  const [loading, setLoading] = useState(false);
  
  // Memoize filtered products to avoid unnecessary re-renders
  const displayProducts = useMemo(() => products, [products]);

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
      setStockUpdates({});
    } else {
      const newSelected = new Set(products.map((p) => p.id));
      setSelectedProducts(newSelected);
      const updates: Record<string, { stock?: number; inStock: boolean }> = {};
      products.forEach((p) => {
        updates[p.id] = { stock: p.stock, inStock: p.inStock };
      });
      setStockUpdates(updates);
    }
  };

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
      const newUpdates = { ...stockUpdates };
      delete newUpdates[productId];
      setStockUpdates(newUpdates);
    } else {
      newSelected.add(productId);
      const product = products.find((p) => p.id === productId);
      if (product) {
        setStockUpdates({
          ...stockUpdates,
          [productId]: { stock: product.stock, inStock: product.inStock },
        });
      }
    }
    setSelectedProducts(newSelected);
  };

  const handleUpdateField = (productId: string, field: "stock" | "inStock", value: any) => {
    setStockUpdates({
      ...stockUpdates,
      [productId]: {
        ...stockUpdates[productId],
        [field]: value,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedProducts.size === 0) {
      toast.error("Please select at least one product");
      return;
    }

    setLoading(true);

    try {
      // Batch all updates into a single API call
      const updates = Array.from(selectedProducts).map((productId) => ({
        productId,
        ...stockUpdates[productId],
      }));

      const response = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error("Update failed");
      }

      toast.success(`Updated ${updates.length} product(s) in a single operation`);
      setSelectedProducts(new Set());
      setStockUpdates({});
      await onUpdate?.();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update inventory");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
        <Package className="w-5 h-5" />
        <span>Bulk Inventory Update</span>
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-4 mb-4">
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {selectedProducts.size === products.length ? "Deselect All" : "Select All"}
          </button>
          <span className="text-sm text-gray-600">
            {selectedProducts.size} product(s) selected
          </span>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {displayProducts.map((product) => (
            <div
              key={product.id}
              className={`p-3 border rounded-lg ${
                selectedProducts.has(product.id) ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedProducts.has(product.id)}
                  onChange={() => handleSelectProduct(product.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500">{product.category}</div>
                </div>
                {selectedProducts.has(product.id) && (
                  <div className="flex items-center space-x-4">
                    <div>
                      <label className="text-xs text-gray-600">Stock</label>
                      <input
                        type="number"
                        value={stockUpdates[product.id]?.stock ?? product.stock ?? ""}
                        onChange={(e) =>
                          handleUpdateField(
                            product.id,
                            "stock",
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Qty"
                      />
                    </div>
                    <div>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stockUpdates[product.id]?.inStock ?? product.inStock}
                          onChange={(e) =>
                            handleUpdateField(product.id, "inStock", e.target.checked)
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-600">In Stock</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || selectedProducts.size === 0}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Updating..." : "Update Inventory"}
        </button>
      </form>
    </div>
  );
}

