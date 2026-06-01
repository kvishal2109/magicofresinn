"use client";

import { useMemo, useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useAdminProducts } from "@/lib/hooks/useAdminProducts";
import { Product } from "@/types";
import ConfirmModal from "@/components/admin/ConfirmModal";
import SingleImageUpload from "@/components/admin/SingleImageUpload";

interface CategoryWithSubcategories {
  name: string;
  subcategories: Array<{ name: string; image?: string }>;
  productCount: number;
  image?: string;
}

export default function CategoriesPage() {
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState<string | null>(null);
  const [newSubcategory, setNewSubcategory] = useState("");
  const [newSubcategoryImage, setNewSubcategoryImage] = useState<string | null>(null);
  const [selectedCategoryForSubcategory, setSelectedCategoryForSubcategory] = useState<string>("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editingSubcategoryKey, setEditingSubcategoryKey] = useState<string | null>(null);
  const [editSubcategoryName, setEditSubcategoryName] = useState("");
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ name: string; count: number } | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingSubcategory, setCreatingSubcategory] = useState(false);
  const { products, loading, mutate } = useAdminProducts();

  const [categoriesMetadata, setCategoriesMetadata] = useState<{
    categories: Record<string, { name: string; image?: string }>;
    subcategories: Record<string, { categoryName: string; subcategoryName: string; image?: string }>;
  }>({ categories: {}, subcategories: {} });

  // Fetch categories metadata on mount - optional, don't fail if blob is suspended
  useEffect(() => {
    fetch("/api/admin/categories/metadata")
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        return null;
      })
      .then((data) => {
        if (data?.success && data.metadata) {
          setCategoriesMetadata(data.metadata);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch categories metadata (blob may be suspended):", err);
        // Set empty metadata so the app continues to work
        setCategoriesMetadata({ categories: {}, subcategories: {} });
      });
  }, []);

  const categoriesWithSubcategories = useMemo(() => {
    const categoryMap = new Map<string, Set<string>>();
    const categoryCounts = new Map<string, number>();

    products.forEach((product: Product) => {
      const cat = product.category;
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, new Set());
        categoryCounts.set(cat, 0);
      }
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
      if (product.subcategory) {
        categoryMap.get(cat)?.add(product.subcategory);
      }
    });

    // Also include categories/subcategories from metadata (no products yet)
    Object.keys(categoriesMetadata.categories).forEach((catName) => {
      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, new Set());
        categoryCounts.set(catName, 0);
      }
    });
    Object.values(categoriesMetadata.subcategories).forEach((sub) => {
      if (!categoryMap.has(sub.categoryName)) {
        categoryMap.set(sub.categoryName, new Set());
        categoryCounts.set(sub.categoryName, 0);
      }
      categoryMap.get(sub.categoryName)?.add(sub.subcategoryName);
    });

    return Array.from(categoryMap.keys()).sort((a, b) => a.localeCompare(b)).map((name) => {
      const subcategoryNames = Array.from(categoryMap.get(name) || []).sort();
      const subcategoriesWithImages = subcategoryNames.map((subName) => {
        const key = `${name}::${subName}`;
        const metadata = categoriesMetadata.subcategories[key];
        return {
          name: subName,
          image: metadata?.image,
        };
      });

      return {
        name,
        subcategories: subcategoriesWithImages,
        productCount: categoryCounts.get(name) || 0,
        image: categoriesMetadata.categories[name]?.image,
      };
    });
  }, [products, categoriesMetadata]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (creatingCategory) return; // Prevent double submission
    
    if (!newCategory.trim()) {
      toast.error("Category name is required");
      return;
    }

    const trimmedCategory = newCategory.trim();
    
    // Check for duplicates in existing products or metadata (case-insensitive)
    const categoryExists = products.some(
      (p) => p.category.toLowerCase() === trimmedCategory.toLowerCase()
    ) || Object.keys(categoriesMetadata.categories).some(
      (name) => name.toLowerCase() === trimmedCategory.toLowerCase()
    );
    if (categoryExists) {
      toast.error("Category already exists");
      setNewCategory("");
      return;
    }

    setCreatingCategory(true);
    
    // Save category in metadata only — no dummy product
    try {
      const imageResponse = await fetch("/api/admin/categories/metadata", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "category",
          categoryName: trimmedCategory,
          imageUrl: newCategoryImage || null,
        }),
      });
      if (!imageResponse.ok) {
        const errorData = await imageResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create category");
      }
      
      toast.success(`Category "${trimmedCategory}" created. Add products to this category from the Products page.`);
      setNewCategory("");
      setNewCategoryImage(null);
      
      // Refresh metadata
      try {
        const metadataRes = await fetch("/api/admin/categories/metadata");
        if (metadataRes.ok) {
          const metadataData = await metadataRes.json();
          if (metadataData.success && metadataData.metadata) {
            setCategoriesMetadata(metadataData.metadata);
          }
        }
      } catch (metadataError) {
        console.warn("Could not refresh metadata:", metadataError);
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category.");
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleEditCategory = (category: string) => {
    setEditingCategory(category);
    setEditCategoryName(category);
  };

  const handleSaveCategory = async (oldCategory: string) => {
    if (!editCategoryName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    if (oldCategory === editCategoryName.trim()) {
      setEditingCategory(null);
      return;
    }

    const trimmedNewName = editCategoryName.trim();
    // Case-insensitive check for duplicates (excluding the current category being edited)
    const categoryExists = categoriesWithSubcategories.some(
      (c) => c.name.toLowerCase() === trimmedNewName.toLowerCase() && c.name !== oldCategory
    );
    if (categoryExists) {
      toast.error("Category name already exists");
      return;
    }

    try {
      const response = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldCategory,
          newCategory: editCategoryName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update category");
      }

      toast.success(`Category renamed from "${oldCategory}" to "${editCategoryName.trim()}"`);
      setEditingCategory(null);

      setCategoriesMetadata((current) => {
        const nextCategories = { ...current.categories };
        const nextSubcategories = { ...current.subcategories };

        if (nextCategories[oldCategory]) {
          nextCategories[editCategoryName.trim()] = {
            ...nextCategories[oldCategory],
            name: editCategoryName.trim(),
          };
          delete nextCategories[oldCategory];
        }

        Object.entries(current.subcategories).forEach(([key, value]) => {
          if (value.categoryName === oldCategory) {
            delete nextSubcategories[key];
            nextSubcategories[`${editCategoryName.trim()}::${value.subcategoryName}`] = {
              ...value,
              categoryName: editCategoryName.trim(),
            };
          }
        });

        return {
          categories: nextCategories,
          subcategories: nextSubcategories,
        };
      });
      
      // Optimistically update cache
      mutate(
        (current) => current?.map((p) => 
          p.category === oldCategory 
            ? { ...p, category: editCategoryName.trim(), updatedAt: new Date() }
            : p
        ) || current,
        { revalidate: false }
      );
      
      // Revalidate in the background
      mutate();
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update category"
      );
    }
  };

  const handleDeleteClick = (category: string) => {
    const categoryData = categoriesWithSubcategories.find((c) => c.name === category);
    setCategoryToDelete({
      name: category,
      count: categoryData?.productCount || 0,
    });
    setShowDeleteModal(true);
  };

  const handleEditSubcategory = (categoryName: string, subcategoryName: string) => {
    setEditingSubcategoryKey(`${categoryName}::${subcategoryName}`);
    setEditSubcategoryName(subcategoryName);
  };

  const handleSaveSubcategory = async (categoryName: string, oldSubcategory: string) => {
    const trimmedNewName = editSubcategoryName.trim();

    if (!trimmedNewName) {
      toast.error("Subcategory name cannot be empty");
      return;
    }

    if (trimmedNewName === oldSubcategory) {
      setEditingSubcategoryKey(null);
      return;
    }

    const subcategoryExists = categoriesWithSubcategories
      .find((category) => category.name === categoryName)
      ?.subcategories.some(
        (subcategory) =>
          subcategory.name.toLowerCase() === trimmedNewName.toLowerCase() &&
          subcategory.name !== oldSubcategory
      );

    if (subcategoryExists) {
      toast.error("Subcategory name already exists in this category");
      return;
    }

    try {
      const response = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryName,
          oldSubcategory,
          newSubcategory: trimmedNewName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update subcategory");
      }

      toast.success(`Subcategory renamed from "${oldSubcategory}" to "${trimmedNewName}"`);
      setEditingSubcategoryKey(null);

      mutate(
        (current) =>
          current?.map((product) =>
            product.category === categoryName && product.subcategory === oldSubcategory
              ? { ...product, subcategory: trimmedNewName, updatedAt: new Date() }
              : product
          ) || current,
        { revalidate: false }
      );

      setCategoriesMetadata((current) => {
        const nextSubcategories = { ...current.subcategories };
        const oldKey = `${categoryName}::${oldSubcategory}`;
        const oldMetadata = nextSubcategories[oldKey];
        if (oldMetadata) {
          delete nextSubcategories[oldKey];
          nextSubcategories[`${categoryName}::${trimmedNewName}`] = {
            ...oldMetadata,
            subcategoryName: trimmedNewName,
          };
        }

        return {
          ...current,
          subcategories: nextSubcategories,
        };
      });

      mutate();
    } catch (error) {
      console.error("Error updating subcategory:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update subcategory"
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    const category = categoryToDelete.name;
    setShowDeleteModal(false);
    setDeletingCategory(category);
    
    try {
      const response = await fetch(`/api/admin/categories?category=${encodeURIComponent(category)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete category: ${response.statusText}`);
      }

      toast.success(`Category "${category}" and all its products have been deleted`);
      setDeletingCategory(null);
      setCategoryToDelete(null);
      
      // Optimistically update cache
      mutate(
        (current) => current?.filter((p) => p.category !== category) || current,
        { revalidate: false }
      );
      
      // Refresh metadata - optional, don't fail if blob is suspended
      try {
        const metadataRes = await fetch("/api/admin/categories/metadata");
        if (metadataRes.ok) {
          const metadataData = await metadataRes.json();
          if (metadataData.success && metadataData.metadata) {
            setCategoriesMetadata(metadataData.metadata);
          }
        }
      } catch (metadataError) {
        console.warn("Could not refresh metadata (blob may be suspended)");
      }
      
      // Revalidate in the background
      mutate();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error(error.message || "Failed to delete category");
      setDeletingCategory(null);
      setCategoryToDelete(null);
    }
  };

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (creatingSubcategory) return; // Prevent double submission
    
    if (!newSubcategory.trim() || !selectedCategoryForSubcategory) {
      toast.error("Subcategory name and category are required");
      return;
    }

    const trimmedSubcategory = newSubcategory.trim();
    
    // Check for duplicates in products or metadata (case-insensitive)
    const subcategoryExistsInProducts = products.some(
      (p) => 
        p.category.toLowerCase() === selectedCategoryForSubcategory.toLowerCase() &&
        p.subcategory &&
        p.subcategory.toLowerCase() === trimmedSubcategory.toLowerCase()
    );
    const subcategoryExistsInMetadata = Object.values(categoriesMetadata.subcategories).some(
      (s) => s.categoryName.toLowerCase() === selectedCategoryForSubcategory.toLowerCase() &&
             s.subcategoryName.toLowerCase() === trimmedSubcategory.toLowerCase()
    );
    if (subcategoryExistsInProducts || subcategoryExistsInMetadata) {
      toast.error("Subcategory already exists in this category");
      setNewSubcategory("");
      return;
    }

    setCreatingSubcategory(true);
    
    // Find the exact category name from products or metadata
    const exactCategoryName = products.find(
      (p) => p.category.toLowerCase() === selectedCategoryForSubcategory.toLowerCase()
    )?.category || selectedCategoryForSubcategory;
    
    // Save subcategory in metadata only — no dummy product
    try {
      const imageResponse = await fetch("/api/admin/categories/metadata", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subcategory",
          categoryName: exactCategoryName,
          subcategoryName: trimmedSubcategory,
          imageUrl: newSubcategoryImage || null,
        }),
      });
      if (!imageResponse.ok) {
        const errorData = await imageResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create subcategory");
      }
      
      toast.success(`Subcategory "${trimmedSubcategory}" added to "${exactCategoryName}". Add products from the Products page.`);
      setNewSubcategory("");
      setNewSubcategoryImage(null);
      
      // Refresh metadata
      try {
        const metadataRes = await fetch("/api/admin/categories/metadata");
        if (metadataRes.ok) {
          const metadataData = await metadataRes.json();
          if (metadataData.success && metadataData.metadata) {
            setCategoriesMetadata(metadataData.metadata);
          }
        }
      } catch (metadataError) {
        console.warn("Could not refresh metadata:", metadataError);
      }
    } catch (error: any) {
      console.error("Error creating subcategory:", error);
      toast.error(error.message || "Failed to create subcategory.");
    } finally {
      setCreatingSubcategory(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-600 mt-1">Manage product categories</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Add New Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter category name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={creatingCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingCategory ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Add Category</span>
                    </>
                  )}
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category Image (Optional)</label>
                <SingleImageUpload
                  value={newCategoryImage || undefined}
                  onChange={(url) => setNewCategoryImage(url)}
                  label="Upload Category Image"
                  folder="categories"
                />
              </div>
            </form>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Add Subcategory</h3>
            <form onSubmit={handleAddSubcategory} className="space-y-3">
              <div className="flex gap-3">
                <select
                  value={selectedCategoryForSubcategory}
                  onChange={(e) => setSelectedCategoryForSubcategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Category</option>
                  {categoriesWithSubcategories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newSubcategory}
                  onChange={(e) => setNewSubcategory(e.target.value)}
                  placeholder="Enter subcategory name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!selectedCategoryForSubcategory}
                />
                <button
                  type="submit"
                  disabled={!selectedCategoryForSubcategory || creatingSubcategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingSubcategory ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Add Subcategory</span>
                    </>
                  )}
                </button>
              </div>
              {selectedCategoryForSubcategory && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Subcategory Image (Optional)</label>
                  <SingleImageUpload
                    value={newSubcategoryImage || undefined}
                    onChange={(url) => setNewSubcategoryImage(url)}
                    label="Upload Subcategory Image"
                    folder="categories"
                  />
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Existing Categories ({categoriesWithSubcategories.length})
          </h2>
          {categoriesWithSubcategories.length === 0 ? (
            <p className="text-gray-500">No categories found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoriesWithSubcategories.map((category) => (
                <div
                  key={category.name}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    {editingCategory === category.name ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="text"
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveCategory(category.name);
                            } else if (e.key === "Escape") {
                              setEditingCategory(null);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleSaveCategory(category.name)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{category.name}</span>
                          <span className="ml-2 text-xs text-gray-500">
                            ({category.productCount} products)
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleEditCategory(category.name)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(category.name)}
                            disabled={deletingCategory === category.name}
                            className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  {category.image && (
                    <div className="mt-2 mb-2">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  {category.subcategories.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs font-medium text-gray-600 mb-1">Subcategories:</div>
                      <div className="flex flex-wrap gap-1">
                         {category.subcategories.map((subcat) => {
                           const subcategoryKey = `${category.name}::${subcat.name}`;

                           return (
                             <div
                               key={subcategoryKey}
                               className="relative group"
                             >
                               {editingSubcategoryKey === subcategoryKey ? (
                                 <div className="flex items-center gap-1">
                                   <input
                                     type="text"
                                     value={editSubcategoryName}
                                     onChange={(e) => setEditSubcategoryName(e.target.value)}
                                     className="w-36 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                     autoFocus
                                     onKeyDown={(e) => {
                                       if (e.key === "Enter") {
                                         handleSaveSubcategory(category.name, subcat.name);
                                       } else if (e.key === "Escape") {
                                         setEditingSubcategoryKey(null);
                                       }
                                     }}
                                   />
                                   <button
                                     onClick={() => handleSaveSubcategory(category.name, subcat.name)}
                                     className="p-1 text-green-600 hover:bg-green-50 rounded"
                                     title="Save"
                                   >
                                     <Check className="w-3.5 h-3.5" />
                                   </button>
                                   <button
                                     onClick={() => setEditingSubcategoryKey(null)}
                                     className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                     title="Cancel"
                                   >
                                     <X className="w-3.5 h-3.5" />
                                   </button>
                                 </div>
                               ) : (
                                 <span className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700 flex items-center gap-1">
                                   {subcat.image && (
                                     <img
                                       src={subcat.image}
                                       alt={subcat.name}
                                       className="w-4 h-4 object-cover rounded"
                                     />
                                   )}
                                   {subcat.name}
                                   <button
                                     onClick={() => handleEditSubcategory(category.name, subcat.name)}
                                     className="ml-1 p-0.5 text-blue-600 hover:bg-blue-50 rounded"
                                     title="Edit subcategory"
                                   >
                                     <Edit2 className="w-3 h-3" />
                                   </button>
                                 </span>
                               )}
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={
          categoryToDelete
            ? `Are you sure you want to delete "${categoryToDelete.name}"? This will permanently delete all ${categoryToDelete.count} product${categoryToDelete.count !== 1 ? "s" : ""} in this category. This action cannot be undone.`
            : ""
        }
        confirmText="Delete Category"
        cancelText="Cancel"
        variant="danger"
        loading={deletingCategory !== null}
      />
    </div>
  );
}

