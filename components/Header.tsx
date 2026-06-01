"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Heart,
  Menu,
  X,
  Settings,
  Grid3x3,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { getCartFromStorage, getCartItemCount, getWishlistFromStorage } from "@/lib/utils/cart";
import type { CatalogTree, CatalogTreeCategory } from "@/lib/supabase/catalog-types";

export default function Header() {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesMenuOpen, setCategoriesMenuOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<CatalogTreeCategory[]>([]);
  const [mounted, setMounted] = useState(false);
  const categoriesMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/catalog-tree")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { tree?: CatalogTree } | null) => {
        if (!data?.tree) return;
        const all: CatalogTreeCategory[] = [
          ...data.tree.globalCategories,
          ...data.tree.catalogs.flatMap((c) => c.categories),
        ];
        setCategories(all);
      })
      .catch(console.error);
  }, []);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    setMounted(true);
    const updateCounts = () => {
      setCartCount(getCartItemCount(getCartFromStorage()));
      setWishlistCount(getWishlistFromStorage().length);
    };
    updateCounts();
    window.addEventListener("storage", updateCounts);
    window.addEventListener("cartUpdated", updateCounts);
    window.addEventListener("wishlistUpdated", updateCounts);
    return () => {
      window.removeEventListener("storage", updateCounts);
      window.removeEventListener("cartUpdated", updateCounts);
      window.removeEventListener("wishlistUpdated", updateCounts);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoriesMenuRef.current && !categoriesMenuRef.current.contains(e.target as Node)) {
        setCategoriesMenuOpen(false);
      }
    };
    if (categoriesMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [categoriesMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setCategoriesMenuOpen(false);
  }, [pathname]);

  const renderCategoryList = (variant: "desktop" | "mobile") =>
    categories.map((category) => {
      const isExpanded = expandedCategories.has(category.id);
      return (
        <div key={category.id} className="mb-2">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className={`flex-1 text-left font-semibold text-purple-700 hover:text-purple-900 py-1 ${
                variant === "mobile" ? "text-sm" : "text-base"
              }`}
              onClick={() => toggleCategory(category.id)}
            >
              {category.name}
            </button>
            <button
              type="button"
              onClick={() => toggleCategory(category.id)}
              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
              aria-expanded={isExpanded}
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
          {isExpanded && (
            <div className={`pl-2 pt-1 space-y-1 ${variant === "mobile" ? "pl-3" : ""}`}>
              {category.subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/products/${category.slug}/${sub.slug}`}
                  className={`block text-gray-600 hover:text-purple-700 hover:bg-purple-50 px-2 py-1.5 rounded transition-colors ${
                    variant === "mobile" ? "text-xs" : "text-sm"
                  }`}
                  onClick={() => {
                    setCategoriesMenuOpen(false);
                    setMobileMenuOpen(false);
                  }}
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    });

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-purple-200/98 via-pink-200/98 to-purple-200/98 backdrop-blur-xl shadow-2xl border-b-2 border-purple-300/60">
      <div className="container mx-auto px-3 sm:px-4 relative">
        <div className="flex items-center justify-between gap-3 h-16 sm:h-20">
          <Link
            href="/"
            className="truncate text-lg sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-700 via-pink-600 to-purple-700 bg-clip-text text-transparent"
          >
            {process.env.NEXT_PUBLIC_APP_NAME || "magi.cofresin"}
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            <Link href="/" className="px-4 py-2 text-purple-800 font-semibold rounded-lg hover:bg-white/50">
              Products
            </Link>
            <Link href="/wishlist" className="relative p-2.5 text-purple-800 rounded-full hover:bg-white/50">
              <Heart className="w-6 h-6" />
              {mounted && wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link href="/cart" className="relative p-2.5 text-purple-800 rounded-full hover:bg-white/50">
              <ShoppingCart className="w-6 h-6" />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {categories.length > 0 && (
              <div className="relative" ref={categoriesMenuRef}>
                <button
                  onClick={() => setCategoriesMenuOpen(!categoriesMenuOpen)}
                  className="p-2.5 text-purple-800 rounded-full hover:bg-white/50"
                  title="Categories"
                >
                  <Grid3x3 className="w-6 h-6" />
                </button>
                {categoriesMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-1rem))] max-h-[80vh] overflow-y-auto bg-white rounded-xl shadow-2xl border-2 border-purple-200/60 z-50 p-4">
                    <h3 className="text-lg font-bold text-purple-800 mb-4 pb-2 border-b-2 border-purple-200">
                      Shop by Categories
                    </h3>
                    {renderCategoryList("desktop")}
                  </div>
                )}
              </div>
            )}

            <Link href="/admin/login" className="p-2.5 text-purple-800 rounded-full hover:bg-white/50" title="Admin">
              <Settings className="w-6 h-6" />
            </Link>
          </nav>

          <button
            className="md:hidden p-2 text-purple-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t-2 border-purple-300/60 bg-white/30 backdrop-blur-md">
            <div className="flex flex-col gap-3 px-2">
              <Link href="/" className="px-4 py-3 font-semibold text-purple-800" onClick={() => setMobileMenuOpen(false)}>
                Products
              </Link>
              <Link href="/wishlist" className="px-4 py-3 text-purple-800" onClick={() => setMobileMenuOpen(false)}>
                Wishlist {mounted && wishlistCount > 0 ? `(${wishlistCount})` : ""}
              </Link>
              <Link href="/cart" className="px-4 py-3 text-purple-800" onClick={() => setMobileMenuOpen(false)}>
                Cart {mounted && cartCount > 0 ? `(${cartCount})` : ""}
              </Link>
              {categories.length > 0 && (
                <div className="border-t border-purple-200 pt-3 px-2">
                  <h3 className="font-bold text-purple-800 mb-2">Shop by Categories</h3>
                  {renderCategoryList("mobile")}
                </div>
              )}
              <Link href="/admin/login" className="px-4 py-3 text-purple-800" onClick={() => setMobileMenuOpen(false)}>
                Admin
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
