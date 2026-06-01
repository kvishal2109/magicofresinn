"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Pencil, Upload, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import type { DbCatalog } from "@/lib/supabase/catalog-types";

interface CatalogForm {
  id?: string;
  name: string;
  slug: string;
  description: string;
  cover_image_url: string;
  pdf_url: string;
  type: string;
  sort_order: number;
  is_active: boolean;
}

const emptyCatalog = (): CatalogForm => ({
  name: "",
  slug: "",
  description: "",
  cover_image_url: "",
  pdf_url: "",
  type: "collection",
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

export default function AdminCatalogsPage() {
  const [catalogs, setCatalogs] = useState<DbCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CatalogForm | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchCatalogs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/catalogs");
      const data = await res.json();
      if (data.success && Array.isArray(data.catalogs)) {
        setCatalogs(data.catalogs);
      }
    } catch {
      toast.error("Failed to load catalogs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  const saveCatalog = async () => {
    if (!form?.name.trim()) {
      toast.error("Catalog name is required");
      return;
    }
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || undefined,
        cover_image_url: form.cover_image_url || undefined,
        pdf_url: form.pdf_url || undefined,
        type: form.type || "collection",
      };
      const res = await fetch("/api/admin/catalogs", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form.id ? { id: form.id, ...payload } : payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success(form.id ? "Catalog updated" : "Catalog created");
      setForm(null);
      fetchCatalogs();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
  };

  const deleteCatalog = async (id: string) => {
    if (!confirm("Delete this catalog?")) return;
    try {
      const res = await fetch(`/api/admin/catalogs?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast.success("Catalog deleted");
      fetchCatalogs();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  const handleUpload = async (
    file: File,
    folder: string,
    field: "cover_image_url" | "pdf_url"
  ) => {
    setUploading(true);
    try {
      const url = await uploadFile(file, folder);
      setForm((f) => f && { ...f, [field]: url });
      toast.success("File uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading catalogs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalogs</h1>
          <p className="text-gray-600 mt-1">Manage PDF catalogs and marketing collections</p>
        </div>
        <button
          onClick={() => setForm(emptyCatalog())}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Catalog
        </button>
      </div>

      {catalogs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
          No catalogs yet. Click &quot;Add Catalog&quot; to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {catalogs.map((cat) => (
            <div key={cat.id} className="bg-white rounded-lg shadow p-4 flex gap-4">
              {cat.cover_image_url ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={cat.cover_image_url} alt={cat.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg bg-gray-100 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                    <p className="text-sm text-gray-500">/{cat.slug}</p>
                    {cat.type && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded mt-1 inline-block">
                        {cat.type}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        setForm({
                          id: cat.id,
                          name: cat.name,
                          slug: cat.slug,
                          description: cat.description || "",
                          cover_image_url: cat.cover_image_url || "",
                          pdf_url: cat.pdf_url || "",
                          type: cat.type || "collection",
                          sort_order: cat.sort_order,
                          is_active: cat.is_active,
                        })
                      }
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCatalog(cat.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {cat.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{cat.description}</p>
                )}
                {cat.pdf_url && (
                  <a
                    href={cat.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 mt-2 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-semibold mb-4">
              {form.id ? "Edit Catalog" : "New Catalog"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="auto-generated from name"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="collection">Collection</option>
                  <option value="pdf">PDF Catalog</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover image</label>
                {form.cover_image_url && (
                  <div className="relative w-24 h-24 mb-2 rounded overflow-hidden">
                    <Image src={form.cover_image_url} alt="" fill className="object-cover" />
                  </div>
                )}
                <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload cover"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, "catalogs", "cover_image_url");
                    }}
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PDF</label>
                {form.pdf_url && (
                  <p className="text-sm text-gray-600 mb-2 truncate">{form.pdf_url}</p>
                )}
                <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload PDF"}
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, "catalogs", "pdf_url");
                    }}
                  />
                </label>
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                    className="w-24 px-3 py-2 border rounded-lg"
                  />
                </div>
                <label className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setForm(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveCatalog}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
