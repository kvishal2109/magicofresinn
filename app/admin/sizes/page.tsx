"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ProductSize } from "@/types";
import { Plus, Trash2, Save, Edit3, Search, X } from "lucide-react";
import { toast } from "react-hot-toast";

interface SizeConfig {
  [key: string]: ProductSize[];
}

export default function SizesPage() {
  const [sizeConfigurations, setSizeConfigurations] = useState<SizeConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSizes();
    fetchAllCategories();
  }, []);

  // Get all available categories (existing size configs + product categories)
  const availableCategories = useMemo(() => {
    const sizeConfigCategories = Object.keys(sizeConfigurations);
    const combined = [...new Set([...allCategories, ...sizeConfigCategories])];
    return combined.sort();
  }, [sizeConfigurations, allCategories]);

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!newCategoryName.trim()) return availableCategories;
    const searchTerm = newCategoryName.toLowerCase();
    return availableCategories.filter(cat => 
      cat.toLowerCase().includes(searchTerm) && 
      !Object.keys(sizeConfigurations).includes(cat)
    );
  }, [newCategoryName, availableCategories, sizeConfigurations]);

  const fetchAllCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.categories) {
          setAllCategories(data.categories);
        }
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  const fetchSizes = async () => {
    try {
      const response = await fetch("/api/admin/sizes");
      const data = await response.json();
      setSizeConfigurations(data.sizeConfigurations);
    } catch (error) {
      toast.error("Failed to load size configurations");
    } finally {
      setLoading(false);
    }
  };

  const saveSizes = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/sizes/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sizeConfigurations }),
      });

      if (response.ok) {
        toast.success("Size configurations saved successfully");
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast.error("Failed to save size configurations");
    } finally {
      setSaving(false);
    }
  };

  const addCategory = (categoryName?: string) => {
    const categoryToAdd = categoryName || newCategoryName.trim();
    if (categoryToAdd && !sizeConfigurations[categoryToAdd]) {
      setSizeConfigurations({
        ...sizeConfigurations,
        [categoryToAdd]: [
          { id: "s", label: "S", dimensions: "", priceModifier: 0 }
        ]
      });
      setNewCategoryName("");
      setShowSuggestions(false);
      toast.success(`Category "${categoryToAdd}" added successfully`);
    } else if (sizeConfigurations[categoryToAdd]) {
      toast.error("This category already exists");
    }
  };

  const selectSuggestion = (category: string) => {
    setNewCategoryName(category);
    setShowSuggestions(false);
    addCategory(category);
  };

  const deleteCategory = (category: string) => {
    const newConfig = { ...sizeConfigurations };
    delete newConfig[category];
    setSizeConfigurations(newConfig);
  };

  const addSize = (category: string) => {
    setSizeConfigurations({
      ...sizeConfigurations,
      [category]: [
        ...sizeConfigurations[category],
        { id: "", label: "", dimensions: "", priceModifier: 0 }
      ]
    });
  };

  const updateSize = (category: string, index: number, field: keyof ProductSize, value: string | number) => {
    const newSizes = [...sizeConfigurations[category]];
    newSizes[index] = { ...newSizes[index], [field]: value };
    setSizeConfigurations({
      ...sizeConfigurations,
      [category]: newSizes
    });
  };

  const deleteSize = (category: string, index: number) => {
    setSizeConfigurations({
      ...sizeConfigurations,
      [category]: sizeConfigurations[category].filter((_, i) => i !== index)
    });
  };

  const renameCategory = (oldName: string, newName: string) => {
    if (newName.trim() && newName !== oldName) {
      const newConfig = { ...sizeConfigurations };
      newConfig[newName] = newConfig[oldName];
      delete newConfig[oldName];
      setSizeConfigurations(newConfig);
    }
    setEditingCategory(null);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Size Chart Management</h1>
        <button
          onClick={saveSizes}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Add New Category */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-semibold mb-3">Add New Product Category</h3>
        <div className="relative" ref={suggestionsRef}>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => {
                  setNewCategoryName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search or type category name (e.g., 'Wall Clocks')"
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {newCategoryName && (
                <button
                  onClick={() => {
                    setNewCategoryName("");
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => addCategory()}
              disabled={!newCategoryName.trim()}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>
          
          {/* Suggestions Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              <div className="p-2 text-xs text-gray-500 font-semibold border-b">Existing Categories</div>
              {filteredSuggestions.map((category) => (
                <button
                  key={category}
                  onClick={() => selectSuggestion(category)}
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
        {availableCategories.length > 0 && (
          <p className="mt-2 text-sm text-gray-500">
            {availableCategories.length} category{availableCategories.length !== 1 ? 'ies' : 'y'} available
          </p>
        )}
      </div>

      {/* Size Configurations */}
      <div className="space-y-4">
        {Object.entries(sizeConfigurations).map(([category, sizes]) => (
          <div key={category} className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              {editingCategory === category ? (
                <input
                  type="text"
                  defaultValue={category}
                  onBlur={(e) => renameCategory(category, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      renameCategory(category, e.currentTarget.value);
                    }
                  }}
                  className="text-lg font-semibold bg-gray-50 px-2 py-1 rounded border"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{category}</h3>
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button
                onClick={() => deleteCategory(category)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-12 gap-3 mb-2 pb-2 border-b font-semibold text-sm text-gray-700">
              <div className="col-span-2">Size ID</div>
              <div className="col-span-2">Size Label</div>
              <div className="col-span-2">Length</div>
              <div className="col-span-2">Width</div>
              <div className="col-span-2">Price (₹)</div>
              <div className="col-span-2">Actions</div>
            </div>

            <div className="space-y-3">
              {sizes.map((size, index) => {
                // Parse dimensions to extract length and width
                const parseDimensions = (dims: string) => {
                  const match = dims.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i);
                  if (match) {
                    return { length: match[1], width: match[2] };
                  }
                  return { length: "", width: "" };
                };

                const { length, width } = parseDimensions(size.dimensions);

                const updateDimensions = (newLength: string, newWidth: string) => {
                  if (newLength && newWidth) {
                    updateSize(category, index, "dimensions", `${newLength}x${newWidth} cm`);
                  } else if (newLength || newWidth) {
                    updateSize(category, index, "dimensions", newLength || newWidth);
                  } else {
                    updateSize(category, index, "dimensions", "");
                  }
                };

                return (
                  <div key={index} className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={size.id}
                        onChange={(e) => updateSize(category, index, "id", e.target.value)}
                        placeholder="s, m, l"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={size.label}
                        onChange={(e) => updateSize(category, index, "label", e.target.value)}
                        placeholder="S, M, L"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={length}
                        onChange={(e) => updateDimensions(e.target.value, width)}
                        placeholder="Length (cm)"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={width}
                        onChange={(e) => updateDimensions(length, e.target.value)}
                        placeholder="Width (cm)"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={size.priceModifier}
                        onChange={(e) => updateSize(category, index, "priceModifier", Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <button
                        onClick={() => deleteSize(category, index)}
                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                        title="Delete size"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => addSize(category)}
              className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <Plus className="w-4 h-4" />
              Add Size
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}