"use client";

import { useEffect, useMemo, useState } from "react";
import { Product, ProductSize } from "@/types";
import { ChevronDown, ChevronRight, Plus, Save, Ruler, Package, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

type SizeConfig = Record<string, ProductSize[]>;

type ProductGroup = {
  category: string;
  subcategories: Array<{
    name: string;
    products: Product[];
  }>;
};

const DIMENSION_UNITS = ["cm", "inch", "m"] as const;

const parseDimensionParts = (dimensions: string) => {
  const trimmed = dimensions.trim();

  if (!trimmed) {
    return { length: "", width: "", unit: "cm" };
  }

  const rangeMatch = trimmed.match(
    /^(\d+(?:\.\d+)?)\s*(?:x|X)\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?$/
  );

  if (rangeMatch) {
    return {
      length: rangeMatch[1],
      width: rangeMatch[2],
      unit: rangeMatch[3] || "cm",
    };
  }

  const singleMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?$/);
  if (singleMatch) {
    return {
      length: singleMatch[1],
      width: "",
      unit: singleMatch[2] || "cm",
    };
  }

  return { length: "", width: "", unit: "cm" };
};

const buildDimensions = (length: string, width: string, unit: string) => {
  const normalizedLength = length.trim();
  const normalizedWidth = width.trim();

  if (!normalizedLength && !normalizedWidth) {
    return "";
  }

  if (normalizedLength && normalizedWidth) {
    return `${normalizedLength}x${normalizedWidth} ${unit}`;
  }

  return `${normalizedLength || normalizedWidth} ${unit}`.trim();
};

export default function SizesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sizeConfigurations, setSizeConfigurations] = useState<SizeConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [sizesResponse, productsResponse] = await Promise.all([
        fetch("/api/admin/sizes"),
        fetch("/api/admin/products", { cache: "no-store" }),
      ]);

      const sizesPayload = await sizesResponse.json().catch(() => ({}));
      const productsPayload = await productsResponse.json().catch(() => ({}));

      if (!sizesResponse.ok) {
        throw new Error(sizesPayload.error || "Failed to load size configurations");
      }

      if (!productsResponse.ok) {
        throw new Error(productsPayload.error || "Failed to load products");
      }

      const loadedProducts: Product[] = productsPayload.products || [];
      const rawConfigurations: SizeConfig = sizesPayload.sizeConfigurations || {};
      const normalizedConfigurations: SizeConfig = {};

      loadedProducts.forEach((product) => {
        const legacySubcategoryKey = product.subcategory?.trim();
        const productConfig =
          rawConfigurations[product.id] ||
          (legacySubcategoryKey ? rawConfigurations[legacySubcategoryKey] : undefined) ||
          rawConfigurations[product.name];

        if (productConfig?.length) {
          normalizedConfigurations[product.id] = productConfig;
        }
      });

      setProducts(loadedProducts);
      setSizeConfigurations(normalizedConfigurations);

      const initialExpandedCategories: Record<string, boolean> = {};
      const initialExpandedSubcategories: Record<string, boolean> = {};

      loadedProducts.forEach((product) => {
        const category = product.category || "Uncategorized";
        const subcategory = product.subcategory?.trim() || "General";
        const subcategoryKey = `${category}::${subcategory}`;

        initialExpandedCategories[category] = initialExpandedCategories[category] ?? false;
        initialExpandedSubcategories[subcategoryKey] =
          initialExpandedSubcategories[subcategoryKey] ?? false;
      });

      setExpandedCategories(initialExpandedCategories);
      setExpandedSubcategories(initialExpandedSubcategories);
      setSelectedProductId((current) => current || loadedProducts[0]?.id || null);
    } catch (error) {
      console.error("Failed to load size chart data:", error);
      toast.error("Failed to load size chart data");
    } finally {
      setLoading(false);
    }
  };

  const productGroups = useMemo<ProductGroup[]>(() => {
    const categoryMap = new Map<string, Map<string, Product[]>>();

    products.forEach((product) => {
      const category = product.category || "Uncategorized";
      const subcategory = product.subcategory?.trim() || "General";

      if (!categoryMap.has(category)) {
        categoryMap.set(category, new Map<string, Product[]>());
      }

      const subcategoryMap = categoryMap.get(category)!;
      if (!subcategoryMap.has(subcategory)) {
        subcategoryMap.set(subcategory, []);
      }

      subcategoryMap.get(subcategory)!.push(product);
    });

    return Array.from(categoryMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, subcategoryMap]) => ({
        category,
        subcategories: Array.from(subcategoryMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([name, subcategoryProducts]) => ({
            name,
            products: subcategoryProducts.sort((a, b) => a.name.localeCompare(b.name)),
          })),
      }));
  }, [products]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const selectedProductSizes = selectedProductId ? sizeConfigurations[selectedProductId] || [] : [];

  const toggleCategory = (category: string) => {
    setExpandedCategories((current) => ({
      ...current,
      [category]: !current[category],
    }));
  };

  const toggleSubcategory = (key: string) => {
    setExpandedSubcategories((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const setProductSizes = (productId: string, updater: (sizes: ProductSize[]) => ProductSize[]) => {
    setSizeConfigurations((current) => ({
      ...current,
      [productId]: updater(current[productId] || []),
    }));
  };

  const addSize = () => {
    if (!selectedProductId) return;

    setProductSizes(selectedProductId, (sizes) => [
      ...sizes,
      { id: "", label: "", dimensions: "", priceModifier: 0 },
    ]);
  };

  const updateSize = (
    productId: string,
    index: number,
    field: keyof ProductSize,
    value: string | number
  ) => {
    setProductSizes(productId, (sizes) =>
      sizes.map((size, sizeIndex) =>
        sizeIndex === index ? { ...size, [field]: value } : size
      )
    );
  };

  const deleteSize = (productId: string, index: number) => {
    setProductSizes(productId, (sizes) => sizes.filter((_, sizeIndex) => sizeIndex !== index));
    setPriceDrafts((current) => {
      const next = { ...current };
      delete next[`${productId}:${index}`];
      return next;
    });
  };

  const updateDimensionsPart = (
    productId: string,
    index: number,
    part: "length" | "width" | "unit",
    value: string
  ) => {
    const currentSize = sizeConfigurations[productId]?.[index];
    if (!currentSize) return;

    const parsed = parseDimensionParts(currentSize.dimensions);
    const nextParts = {
      ...parsed,
      [part]: value,
    };

    updateSize(
      productId,
      index,
      "dimensions",
      buildDimensions(nextParts.length, nextParts.width, nextParts.unit)
    );
  };

  const getPriceDraftKey = (productId: string, index: number) => `${productId}:${index}`;

  const handlePriceDraftChange = (productId: string, index: number, value: string) => {
    const draftKey = getPriceDraftKey(productId, index);

    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setPriceDrafts((current) => ({
      ...current,
      [draftKey]: value,
    }));
  };

  const commitPriceDraft = (productId: string, index: number) => {
    const draftKey = getPriceDraftKey(productId, index);
    const draftValue = priceDrafts[draftKey];

    if (draftValue === undefined) {
      return;
    }

    updateSize(
      productId,
      index,
      "priceModifier",
      draftValue.trim() === "" ? 0 : Number(draftValue)
    );

    setPriceDrafts((current) => {
      const next = { ...current };
      delete next[draftKey];
      return next;
    });
  };

  const saveSizes = async () => {
    setSaving(true);

    try {
      const sanitizedConfigurations: SizeConfig = Object.fromEntries(
        Object.entries(sizeConfigurations).map(([productId, sizes]) => [
          productId,
          sizes.map((size, index) => {
            const draftValue = priceDrafts[getPriceDraftKey(productId, index)];
            return {
              ...size,
              priceModifier:
                draftValue === undefined || draftValue.trim() === ""
                  ? size.priceModifier
                  : Number(draftValue),
            };
          }),
        ])
      );

      setSizeConfigurations(sanitizedConfigurations);
      setPriceDrafts({});

      const response = await fetch("/api/admin/sizes/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sizeConfigurations: sanitizedConfigurations }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to save size configurations");
      }

      toast.success("Size configurations saved successfully");
    } catch (error) {
      console.error("Failed to save size configurations:", error);
      toast.error("Failed to save size configurations");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Size Chart Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Select a subcategory, then a product, and manage sizes at product level.
          </p>
        </div>
        <button
          onClick={saveSizes}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
        <div className="bg-white border rounded-lg p-4 h-fit">
          <h2 className="text-lg font-semibold mb-4">Catalog</h2>
          <div className="space-y-3">
            {productGroups.map((group) => {
              const isCategoryExpanded = expandedCategories[group.category];

              return (
                <div key={group.category} className="border rounded-lg">
                  <button
                    onClick={() => toggleCategory(group.category)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-semibold text-gray-900">{group.category}</div>
                      <div className="text-xs text-gray-500">
                        {group.subcategories.length} subcategor{group.subcategories.length === 1 ? "y" : "ies"}
                      </div>
                    </div>
                    {isCategoryExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>

                  {isCategoryExpanded && (
                    <div className="px-3 pb-3 space-y-2">
                      {group.subcategories.map((subcategory) => {
                        const subcategoryKey = `${group.category}::${subcategory.name}`;
                        const isSubcategoryExpanded = expandedSubcategories[subcategoryKey];

                        return (
                          <div key={subcategoryKey} className="border rounded-lg bg-gray-50">
                            <button
                              onClick={() => toggleSubcategory(subcategoryKey)}
                              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-100 rounded-lg"
                            >
                              <div>
                                <div className="font-medium text-gray-800">{subcategory.name}</div>
                                <div className="text-xs text-gray-500">
                                  {subcategory.products.length} product{subcategory.products.length === 1 ? "" : "s"}
                                </div>
                              </div>
                              {isSubcategoryExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                            </button>

                            {isSubcategoryExpanded && (
                              <div className="px-2 pb-2 space-y-1">
                                {subcategory.products.map((product) => {
                                  const isSelected = selectedProductId === product.id;
                                  const sizeCount = sizeConfigurations[product.id]?.length || 0;

                                  return (
                                    <button
                                      key={product.id}
                                      onClick={() => setSelectedProductId(product.id)}
                                      className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                                        isSelected
                                          ? "bg-blue-50 border-blue-300 text-blue-900"
                                          : "bg-white border-transparent hover:border-gray-200"
                                      }`}
                                    >
                                      <div className="font-medium">{product.name}</div>
                                      <div className="text-xs text-gray-500">
                                        {sizeCount} size option{sizeCount === 1 ? "" : "s"}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          {selectedProduct ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedProduct.name}</h2>
                  <div className="text-sm text-gray-500 mt-1">
                    {selectedProduct.category}
                    {" / "}
                    {selectedProduct.subcategory || "General"}
                  </div>
                </div>
                <div className="text-sm text-gray-500 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Package className="w-4 h-4" />
                    <span>{selectedProduct.id}</span>
                  </div>
                  <div className="mt-1">Base price: Rs. {selectedProduct.price}</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Sizes</h3>
                  <p className="text-sm text-gray-500">
                    Add dimensions and price modifiers for this specific product.
                  </p>
                </div>
                <button
                  onClick={addSize}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Size
                </button>
              </div>

              {selectedProductSizes.length === 0 ? (
                <div className="border border-dashed rounded-lg p-8 text-center text-gray-500">
                  <Ruler className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                  <p>No sizes configured for this product yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-3 pb-2 border-b font-semibold text-sm text-gray-700">
                    <div className="col-span-2">Size ID</div>
                    <div className="col-span-2">Label</div>
                    <div className="col-span-3">Dimensions</div>
                    <div className="col-span-3">Price Modifier</div>
                    <div className="col-span-2">Actions</div>
                  </div>

                  {selectedProductSizes.map((size, index) => (
                    <div key={`${selectedProduct.id}-${index}`} className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={size.id}
                          onChange={(e) => updateSize(selectedProduct.id, index, "id", e.target.value)}
                          placeholder="s, m, l"
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={size.label}
                          onChange={(e) => updateSize(selectedProduct.id, index, "label", e.target.value)}
                          placeholder="Small"
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div className="col-span-3">
                        {(() => {
                          const { length, width, unit } = parseDimensionParts(size.dimensions);

                          return (
                            <div className="grid grid-cols-[1fr_1fr_88px] gap-2">
                              <input
                                type="number"
                                inputMode="decimal"
                                value={length}
                                onChange={(e) =>
                                  updateDimensionsPart(
                                    selectedProduct.id,
                                    index,
                                    "length",
                                    e.target.value
                                  )
                                }
                                placeholder="Length"
                                className="w-full px-3 py-2 border rounded-lg"
                              />
                              <input
                                type="number"
                                inputMode="decimal"
                                value={width}
                                onChange={(e) =>
                                  updateDimensionsPart(
                                    selectedProduct.id,
                                    index,
                                    "width",
                                    e.target.value
                                  )
                                }
                                placeholder="Width"
                                className="w-full px-3 py-2 border rounded-lg"
                              />
                              <select
                                value={unit}
                                onChange={(e) =>
                                  updateDimensionsPart(
                                    selectedProduct.id,
                                    index,
                                    "unit",
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-2 border rounded-lg bg-white"
                              >
                                {DIMENSION_UNITS.map((dimensionUnit) => (
                                  <option key={dimensionUnit} value={dimensionUnit}>
                                    {dimensionUnit}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="col-span-3">
                        {(() => {
                          const draftKey = getPriceDraftKey(selectedProduct.id, index);
                          const priceValue =
                            priceDrafts[draftKey] ?? String(size.priceModifier ?? 0);

                          return (
                        <input
                          type="number"
                          value={priceValue}
                          onChange={(e) =>
                            handlePriceDraftChange(selectedProduct.id, index, e.target.value)
                          }
                          onBlur={() => commitPriceDraft(selectedProduct.id, index)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              commitPriceDraft(selectedProduct.id, index);
                            }
                          }}
                          placeholder="0"
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                          );
                        })()}
                      </div>
                      <div className="col-span-2">
                        <button
                          onClick={() => deleteSize(selectedProduct.id, index)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                          title="Delete size"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              Select a product to manage its size chart.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
