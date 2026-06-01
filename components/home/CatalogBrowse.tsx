"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Home as HomeIcon } from "lucide-react";
import type { CatalogTree, CatalogTreeCategory } from "@/lib/supabase/catalog-types";

interface CatalogBrowseProps {
  initialTree?: CatalogTree | null;
}

function CategoryCard({
  category,
  onSelect,
  isSelected,
}: {
  category: CatalogTreeCategory;
  onSelect: () => void;
  isSelected: boolean;
}) {
  return (
    <div className={isSelected ? "md:col-span-2 lg:col-span-4 space-y-0" : ""}>
      <div
        className={`group relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform cursor-pointer bg-gradient-to-br from-purple-500 to-pink-500 ${
          isSelected ? "hover:scale-100" : "hover:scale-105"
        }`}
        onClick={onSelect}
      >
        <div className="relative z-10 p-5 sm:p-6 min-h-[260px] sm:min-h-[300px] flex flex-col">
          <div className="mb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <HomeIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{category.name}</h3>
          <p className="text-white/80 text-sm mb-4">
            {category.subcategories.length} subcategories
          </p>
          {category.imageUrl && (
            <div className="mt-auto relative h-28 sm:h-32 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
              <Image
                src={category.imageUrl}
                alt={category.name}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          )}
          <div className="absolute bottom-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <ArrowRight
              className={`w-5 h-5 text-white transform transition-transform ${
                isSelected ? "rotate-90" : ""
              }`}
            />
          </div>
        </div>
      </div>

      {isSelected && category.subcategories.length > 0 && (
        <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-purple-100/50 p-4 sm:p-6">
            <h3 className="text-xl font-bold text-purple-800 mb-4">{category.name} Subcategories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              {category.subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/products/${category.slug}/${sub.slug}`}
                  className="group relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all bg-white border border-gray-200/50"
                >
                  {sub.imageUrl ? (
                    <div className="relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50">
                      <Image
                        src={sub.imageUrl}
                        alt={sub.name}
                        fill
                        sizes="25vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="h-40 sm:h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <HomeIcon className="w-12 h-12 text-purple-400" />
                    </div>
                  )}
                  <div className="p-3 sm:p-4">
                    <h4 className="font-bold text-sm sm:text-base text-gray-900 line-clamp-2">
                      {sub.name}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {sub.productCount} {sub.productCount === 1 ? "product" : "products"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CatalogBrowse({ initialTree }: CatalogBrowseProps) {
  const [tree, setTree] = useState<CatalogTree | null>(initialTree ?? null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialTree);

  useEffect(() => {
    if (initialTree) return;

    fetch("/api/catalog-tree")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.tree) setTree(data.tree);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [initialTree]);

  const allCategories: CatalogTreeCategory[] = [
    ...(tree?.globalCategories || []),
    ...(tree?.catalogs || []).flatMap((c) => c.categories),
  ];

  if (loading) {
    return (
      <div className="text-center py-12 text-purple-700">Loading catalog...</div>
    );
  }

  if (allCategories.length === 0) {
    return (
      <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200">
        <p className="text-gray-600">No categories yet. Add them from the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {allCategories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          isSelected={selectedCategoryId === category.id}
          onSelect={() =>
            setSelectedCategoryId((prev) => (prev === category.id ? null : category.id))
          }
        />
      ))}
    </div>
  );
}
