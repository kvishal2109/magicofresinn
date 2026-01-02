"use client";

import { useState, useEffect } from "react";
import { ProductSize } from "@/types";
import { Plus, Trash2, Save, Edit3 } from "lucide-react";
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

  useEffect(() => {
    fetchSizes();
  }, []);

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

  const addCategory = () => {
    if (newCategoryName.trim()) {
      setSizeConfigurations({
        ...sizeConfigurations,
        [newCategoryName]: [
          { id: "s", label: "S", dimensions: "", priceModifier: 0 }
        ]
      });
      setNewCategoryName("");
    }
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
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name (e.g., 'Wall Clocks')"
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button
            onClick={addCategory}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
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

            <div className="space-y-3">
              {sizes.map((size, index) => (
                <div key={index} className="grid grid-cols-5 gap-3 items-center">
                  <input
                    type="text"
                    value={size.id}
                    onChange={(e) => updateSize(category, index, "id", e.target.value)}
                    placeholder="ID (s, m, l)"
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    value={size.label}
                    onChange={(e) => updateSize(category, index, "label", e.target.value)}
                    placeholder="Label (S, M, L)"
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    value={size.dimensions}
                    onChange={(e) => updateSize(category, index, "dimensions", e.target.value)}
                    placeholder="Dimensions (25x25 cm)"
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    value={size.priceModifier}
                    onChange={(e) => updateSize(category, index, "priceModifier", Number(e.target.value))}
                    placeholder="Price modifier"
                    className="px-3 py-2 border rounded-lg"
                  />
                  <button
                    onClick={() => deleteSize(category, index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
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