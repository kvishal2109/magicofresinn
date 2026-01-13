"use client";

import Link from "next/link";
import { ShoppingCart, Heart, Menu, X, Settings, Grid3x3, ChevronRight, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getCartFromStorage, getCartItemCount } from "@/lib/utils/cart";
import { getWishlistFromStorage } from "@/lib/utils/cart";
import { subcategories } from "@/lib/data/subcategories";
import { CATEGORY_NAME_TO_SLUG, SUBCATEGORY_NAME_TO_SLUG } from "@/lib/data/categoryMaps";

export default function Header() {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesMenuOpen, setCategoriesMenuOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const categoriesMenuRef = useRef<HTMLDivElement>(null);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  useEffect(() => {
    setMounted(true);
    const updateCounts = () => {
      const cart = getCartFromStorage();
      const wishlist = getWishlistFromStorage();
      setCartCount(getCartItemCount(cart));
      setWishlistCount(wishlist.length);
    };

    updateCounts();
    // Update counts when storage changes
    window.addEventListener("storage", updateCounts);
    // Custom event for same-tab updates
    window.addEventListener("cartUpdated", updateCounts);
    window.addEventListener("wishlistUpdated", updateCounts);

    return () => {
      window.removeEventListener("storage", updateCounts);
      window.removeEventListener("cartUpdated", updateCounts);
      window.removeEventListener("wishlistUpdated", updateCounts);
    };
  }, []);

  // Close categories menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoriesMenuRef.current && !categoriesMenuRef.current.contains(event.target as Node)) {
        setCategoriesMenuOpen(false);
      }
    };

    if (categoriesMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [categoriesMenuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-purple-200/98 via-pink-200/98 to-purple-200/98 backdrop-blur-xl shadow-2xl border-b-2 border-purple-300/60">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-pink-400/10 to-purple-400/10"></div>
      <div className="container mx-auto px-4 relative">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="group relative text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-700 via-pink-600 to-purple-700 bg-clip-text text-transparent hover:from-purple-600 hover:via-pink-500 hover:to-purple-600 transition-all duration-300 drop-shadow-lg hover:scale-105 transform">
            <span className="relative z-10">{process.env.NEXT_PUBLIC_APP_NAME || "magi.cofresin"}</span>
            <span className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300"></span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/"
              className="relative px-4 py-2 text-purple-800 hover:text-purple-900 transition-all duration-300 font-semibold rounded-lg hover:bg-white/50 backdrop-blur-sm group"
            >
              <span className="relative z-10">Products</span>
              <span className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </Link>
            <Link
              href="/wishlist"
              className="relative p-2.5 text-purple-800 hover:text-purple-900 transition-all duration-300 rounded-full hover:bg-white/50 backdrop-blur-sm group"
            >
              <Heart className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform duration-300" />
              {mounted && wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg animate-pulse border-2 border-white">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              className="relative p-2.5 text-purple-800 hover:text-purple-900 transition-all duration-300 rounded-full hover:bg-white/50 backdrop-blur-sm group"
            >
              <ShoppingCart className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform duration-300" />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg animate-pulse border-2 border-white">
                  {cartCount}
                </span>
              )}
            </Link>
            {/* Categories Menu */}
            <div className="relative" ref={categoriesMenuRef}>
              <button
                onClick={() => setCategoriesMenuOpen(!categoriesMenuOpen)}
                className="relative p-2.5 text-purple-800 hover:text-purple-900 transition-all duration-300 rounded-full hover:bg-white/50 backdrop-blur-sm group"
                title="Categories"
              >
                <Grid3x3 className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
              </button>

              {/* Categories Dropdown */}
              {categoriesMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 max-h-[80vh] overflow-y-auto bg-white rounded-xl shadow-2xl border-2 border-purple-200/60 backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-purple-800 mb-4 pb-2 border-b-2 border-purple-200">
                      Shop by Categories
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(subcategories).map(([category, subcats]) => {
                        const categorySlug = CATEGORY_NAME_TO_SLUG[category] || category.toLowerCase().replace(/\s+/g, "-");
                        const isExpanded = expandedCategories.has(category);
                        return (
                          <div key={category} className="mb-2">
                            <div className="flex items-center justify-between gap-2">
                              <Link
                                href={`/products/${categorySlug}`}
                                className="flex-1 text-base font-semibold text-purple-700 hover:text-purple-900 transition-colors py-1"
                                onClick={() => setCategoriesMenuOpen(false)}
                              >
                                {category}
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleCategory(category);
                                }}
                                className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-all duration-200 touch-manipulation"
                                aria-label={isExpanded ? "Collapse" : "Expand"}
                                aria-expanded={isExpanded}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-5 h-5" />
                                ) : (
                                  <ChevronRight className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                            <div
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                              }`}
                            >
                              <div className="pl-2 pt-1 space-y-1">
                                {subcats.map((subcat) => {
                                  const subcategorySlug = subcat.slug || SUBCATEGORY_NAME_TO_SLUG[subcat.name] || subcat.name.toLowerCase().replace(/\s+/g, "-");
                                  return (
                                    <Link
                                      key={subcat.name}
                                      href={`/products/${categorySlug}/${subcategorySlug}`}
                                      className="block text-sm text-gray-700 hover:text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-lg transition-all duration-200"
                                      onClick={() => setCategoriesMenuOpen(false)}
                                    >
                                      {subcat.name}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/admin/login"
              className="p-2.5 text-purple-800 hover:text-purple-900 transition-all duration-300 rounded-full hover:bg-white/50 backdrop-blur-sm group"
              title="Admin Panel"
            >
              <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-purple-800 hover:text-purple-900 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-6 border-t-2 border-purple-300/60 bg-white/30 backdrop-blur-md animate-in slide-in-from-top duration-300">
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className="px-4 py-3 text-purple-800 hover:text-purple-900 hover:bg-white/50 rounded-lg transition-all duration-300 font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href="/wishlist"
                className="flex items-center gap-3 px-4 py-3 text-purple-800 hover:text-purple-900 hover:bg-white/50 rounded-lg transition-all duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Heart className="w-6 h-6" />
                <span className="font-semibold">Wishlist</span>
                {mounted && wishlistCount > 0 && (
                  <span className="ml-auto bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs rounded-full px-3 py-1 font-bold shadow-lg">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link
                href="/cart"
                className="flex items-center gap-3 px-4 py-3 text-purple-800 hover:text-purple-900 hover:bg-white/50 rounded-lg transition-all duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingCart className="w-6 h-6" />
                <span className="font-semibold">Cart</span>
                {mounted && cartCount > 0 && (
                  <span className="ml-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-full px-3 py-1 font-bold shadow-lg">
                    {cartCount}
                  </span>
                )}
              </Link>
              {/* Mobile Categories Section */}
              <div className="border-t-2 border-purple-200/60 pt-3 mt-3">
                <div className="px-4 py-2 mb-2">
                  <h3 className="text-base font-bold text-purple-800 mb-3">Shop by Categories</h3>
                  <div className="space-y-2">
                    {Object.entries(subcategories).map(([category, subcats]) => {
                      const categorySlug = CATEGORY_NAME_TO_SLUG[category] || category.toLowerCase().replace(/\s+/g, "-");
                      const isExpanded = expandedCategories.has(category);
                      return (
                        <div key={category} className="mb-2">
                          <div className="flex items-center justify-between gap-2">
                            <Link
                              href={`/products/${categorySlug}`}
                              className="flex-1 text-sm font-semibold text-purple-700 hover:text-purple-900 py-1.5"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {category}
                            </Link>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleCategory(category);
                              }}
                              className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-all duration-200 touch-manipulation"
                              aria-label={isExpanded ? "Collapse" : "Expand"}
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="pl-3 pt-1 space-y-1">
                              {subcats.map((subcat) => {
                                const subcategorySlug = subcat.slug || SUBCATEGORY_NAME_TO_SLUG[subcat.name] || subcat.name.toLowerCase().replace(/\s+/g, "-");
                                return (
                                  <Link
                                    key={subcat.name}
                                    href={`/products/${categorySlug}/${subcategorySlug}`}
                                    className="block text-xs text-gray-600 hover:text-purple-700 hover:bg-purple-50 px-2 py-1.5 rounded transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                  >
                                    {subcat.name}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Link
                href="/admin/login"
                className="flex items-center gap-3 px-4 py-3 text-purple-800 hover:text-purple-900 hover:bg-white/50 rounded-lg transition-all duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings className="w-6 h-6" />
                <span className="font-semibold">Admin</span>
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

