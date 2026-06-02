"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Pencil, ChevronDown, ChevronRight, Upload } from "lucide-react";
import toast from "react-hot-toast";
import AdminModal from "@/components/admin/AdminModal";
import type { DbCategory, DbSubcategory } from "@/lib/supabase/catalog-types";

interface CategoryForm {
  id?: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

interface SubcategoryForm {
  id?: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

const emptyCategory = (): CategoryForm => ({
  name: "",
  slug: "",
  description: "",
  image_url: "",
  sort_order: 0,
  is_active: true,
});

const emptySubcategory = (categoryId: string): SubcategoryForm => ({
  category_id: categoryId,
  name: "",
  slug: "",
  description: "",
  image_url: "",
  sort_order: 0,
  is_active: true,
});

async function uploadFile(file: File, folder: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [subcategories, setSubcategories] = useState<Record<string, DbSubcategory[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [categoryForm, setCategoryForm] = useState<CategoryForm | null>(null);
  const [subcategoryForm, setSubcategoryForm] = useState<SubcategoryForm | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCategoryAdvanced, setShowCategoryAdvanced] = useState(false);
  const [showSubcategoryAdvanced, setShowSubcategoryAdvanced] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories-v2");
      const data = await res.json();
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubcategories = useCallback(async (categoryId: string) => {
    try {
      const res = await fetch(`/api/admin/subcategories?categoryId=${categoryId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.subcategories)) {
        setSubcategories((prev) => ({ ...prev, [categoryId]: data.subcategories }));
      }
    } catch {
      toast.error("Failed to load subcategories");
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const toggleExpand = async (categoryId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
        if (!subcategories[categoryId]) {
          fetchSubcategories(categoryId);
        }
      }
      return next;
    });
  };

  const saveCategory = async () => {
    if (!categoryForm?.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      const payload = {
        ...categoryForm,
        name: categoryForm.name.trim(),
        slug: categoryForm.slug.trim() || undefined,
        description: categoryForm.description.trim() || undefined,
        image_url: categoryForm.image_url || undefined,
      };
      const res = await fetch("/api/admin/categories-v2", {
        method: categoryForm.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm.id ? { id: categoryForm.id, ...payload } : payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success(categoryForm.id ? "Category updated" : "Category created");
      setCategoryForm(null);
      fetchCategories();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category and all its subcategories?")) return;
    try {
      const res = await fetch(`/api/admin/categories-v2?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast.success("Category deleted");
      fetchCategories();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  const saveSubcategory = async () => {
    if (!subcategoryForm?.name.trim() || !subcategoryForm.category_id) {
      toast.error("Subcategory name is required");
      return;
    }
    try {
      const payload = {
        ...subcategoryForm,
        name: subcategoryForm.name.trim(),
        slug: subcategoryForm.slug.trim() || undefined,
        description: subcategoryForm.description.trim() || undefined,
        image_url: subcategoryForm.image_url || undefined,
      };
      const res = await fetch("/api/admin/subcategories", {
        method: subcategoryForm.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subcategoryForm.id ? { id: subcategoryForm.id, ...payload } : payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success(subcategoryForm.id ? "Subcategory updated" : "Subcategory created");
      const catId = subcategoryForm.category_id;
      setSubcategoryForm(null);
      fetchSubcategories(catId);
      fetchCategories();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
  };

  const deleteSubcategory = async (id: string, categoryId: string) => {
    if (!confirm("Delete this subcategory?")) return;
    try {
      const res = await fetch(`/api/admin/subcategories?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast.success("Subcategory deleted");
      fetchSubcategories(categoryId);
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  const handleImageUpload = async (
    file: File,
    folder: string,
    onUrl: (url: string) => void
  ) => {
    setUploadingImage(true);
    try {
      const url = await uploadFile(file, folder);
      onUrl(url);
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories & Subcategories</h1>
          <p className="text-gray-600 mt-1">Manage shop sections shown on the homepage and header menu.</p>
        </div>
        <button
          onClick={() => {
            setShowCategoryAdvanced(false);
            setCategoryForm(emptyCategory());
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
          No categories yet. Click &quot;Add Category&quot; to create one.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y">
          {categories.map((cat) => {
            const isOpen = expanded.has(cat.id);
            const subs = subcategories[cat.id] || [];
            return (
              <div key={cat.id} className="p-4">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="mt-1 p-1 hover:bg-gray-100 rounded"
                  >
                    {isOpen ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {cat.image_url ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                      {!cat.is_active && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">Hidden</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">/{cat.slug}</p>
                    {cat.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowCategoryAdvanced(true);
                        setCategoryForm({
                          id: cat.id,
                          name: cat.name,
                          slug: cat.slug,
                          description: cat.description || "",
                          image_url: cat.image_url || "",
                          sort_order: cat.sort_order,
                          is_active: cat.is_active,
                        });
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 ml-9 pl-4 border-l-2 border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Subcategories</h4>
                      <button
                        onClick={() => {
                        setShowSubcategoryAdvanced(false);
                        setSubcategoryForm(emptySubcategory(cat.id));
                      }}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                    {subs.length === 0 ? (
                      <p className="text-sm text-gray-500">No subcategories</p>
                    ) : (
                      <div className="space-y-2">
                        {subs.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                          >
                            {sub.image_url ? (
                              <div className="relative w-10 h-10 rounded overflow-hidden">
                                <Image src={sub.image_url} alt={sub.name} fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-100" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{sub.name}</p>
                              <p className="text-xs text-gray-500">/{sub.slug}</p>
                            </div>
                            <button
                              onClick={() => {
                                setShowSubcategoryAdvanced(true);
                                setSubcategoryForm({
                                  id: sub.id,
                                  category_id: sub.category_id,
                                  name: sub.name,
                                  slug: sub.slug,
                                  description: sub.description || "",
                                  image_url: sub.image_url || "",
                                  sort_order: sub.sort_order,
                                  is_active: sub.is_active,
                                });
                              }}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteSubcategory(sub.id, cat.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {categoryForm && (
        <AdminModal
          open={!!categoryForm}
          onClose={() => setCategoryForm(null)}
          title={categoryForm.id ? "Edit Category" : "New Category"}
          description="Appears on the homepage and in the header menu."
          size="sm"
          footer={
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => setCategoryForm(null)}
                className="w-full sm:w-auto px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCategory}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g. Wedding, Home Decor"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover image</label>
              {categoryForm.image_url ? (
                <div className="relative w-20 h-20 mb-2 rounded-lg overflow-hidden border">
                  <Image src={categoryForm.image_url} alt="" fill className="object-cover" />
                </div>
              ) : null}
              <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50 text-sm">
                <Upload className="w-4 h-4" />
                {uploadingImage ? "Uploading..." : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file, "categories", (url) =>
                        setCategoryForm((f) => f && { ...f, image_url: url })
                      );
                    }
                  }}
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => setShowCategoryAdvanced((v) => !v)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showCategoryAdvanced ? "Hide advanced options" : "Show advanced options"}
            </button>
            {showCategoryAdvanced && (
              <div className="space-y-4 pt-1 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug <span className="text-gray-400 font-normal">(auto-generated if empty)</span>
                  </label>
                  <input
                    type="text"
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, description: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort order</label>
                    <input
                      type="number"
                      value={categoryForm.sort_order}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, sort_order: Number(e.target.value) })
                      }
                      className="w-24 px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={categoryForm.is_active}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, is_active: e.target.checked })
                      }
                    />
                    <span className="text-sm">Visible on storefront</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </AdminModal>
      )}

      {subcategoryForm && (
        <AdminModal
          open={!!subcategoryForm}
          onClose={() => setSubcategoryForm(null)}
          title={subcategoryForm.id ? "Edit Subcategory" : "New Subcategory"}
          size="sm"
          footer={
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => setSubcategoryForm(null)}
                className="w-full sm:w-auto px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSubcategory}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={subcategoryForm.name}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
              {subcategoryForm.image_url ? (
                <div className="relative w-20 h-20 mb-2 rounded-lg overflow-hidden border">
                  <Image src={subcategoryForm.image_url} alt="" fill className="object-cover" />
                </div>
              ) : null}
              <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50 text-sm">
                <Upload className="w-4 h-4" />
                {uploadingImage ? "Uploading..." : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file, "subcategories", (url) =>
                        setSubcategoryForm((f) => f && { ...f, image_url: url })
                      );
                    }
                  }}
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => setShowSubcategoryAdvanced((v) => !v)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showSubcategoryAdvanced ? "Hide advanced options" : "Show advanced options"}
            </button>
            {showSubcategoryAdvanced && (
              <div className="space-y-4 pt-1 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug (optional)</label>
                  <input
                    type="text"
                    value={subcategoryForm.slug}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, slug: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={subcategoryForm.description}
                    onChange={(e) =>
                      setSubcategoryForm({ ...subcategoryForm, description: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort order</label>
                    <input
                      type="number"
                      value={subcategoryForm.sort_order}
                      onChange={(e) =>
                        setSubcategoryForm({ ...subcategoryForm, sort_order: Number(e.target.value) })
                      }
                      className="w-24 px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={subcategoryForm.is_active}
                      onChange={(e) =>
                        setSubcategoryForm({ ...subcategoryForm, is_active: e.target.checked })
                      }
                    />
                    <span className="text-sm">Visible on storefront</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </AdminModal>
      )}
    </div>
  );
}
