"use client";

import { useRouter } from "next/navigation";
import { Product } from "@/types";
import { ArrowLeft } from "lucide-react";
import ProductCard from "@/components/ProductCard";

interface SubcategoryProductsClientProps {
  products: Product[];
  categoryName: string;
  subcategoryName: string;
}

export default function SubcategoryProductsClient({
  products,
  categoryName,
  subcategoryName,
}: SubcategoryProductsClientProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-purple-800 hover:text-purple-900 transition-all duration-300 font-semibold group hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>
          <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl p-8 border-2 border-purple-200 shadow-xl backdrop-blur-sm">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-700 via-pink-600 to-purple-700 bg-clip-text text-transparent mb-3">
              {subcategoryName}
            </h1>
            <div className="flex items-center gap-2 text-gray-600 text-lg">
              <span className="font-semibold text-purple-700">{categoryName}</span>
              <span>•</span>
              <span className="font-medium">{products.length} {products.length === 1 ? 'product' : 'products'}</span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-600 text-xl font-semibold mb-2">No products found</p>
              <p className="text-gray-500">Check back later for new items in this category.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <div
                key={product.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

