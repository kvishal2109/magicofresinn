"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Product } from "@/types";
import {
  getWishlistFromStorage,
  addToCart,
} from "@/lib/utils/cart";
import ProductCard from "@/components/ProductCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { calculateDiscount } from "@/lib/utils/format";
import toast from "react-hot-toast";
import { Heart, ShoppingCart, Sparkles } from "lucide-react";

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function WishlistPage() {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const handleMoveAllToCart = () => {
    const available = products.filter((product) => product.inStock);
    if (available.length === 0) {
      toast.error("No in-stock items to move right now.");
      return;
    }

    available.forEach((product) => addToCart(product, 1));
    window.dispatchEvent(new Event("cartUpdated"));
    toast.success(`Moved ${available.length} item(s) to cart`);
  };

  const handleMoveToCart = (product: Product) => {
    if (!product.inStock) {
      toast.error("This product is currently out of stock.");
      return;
    }
    addToCart(product, 1);
    window.dispatchEvent(new Event("cartUpdated"));
    toast.success(`${product.name} added to cart`);
  };

  useEffect(() => {
    const updateWishlist = () => {
      const ids = getWishlistFromStorage();
      setWishlistIds(ids);
    };

    updateWishlist();
    window.addEventListener("wishlistUpdated", updateWishlist);
    window.addEventListener("storage", updateWishlist);

    return () => {
      window.removeEventListener("wishlistUpdated", updateWishlist);
      window.removeEventListener("storage", updateWishlist);
    };
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/products");
        const result = await response.json();
        const allProducts: Product[] = result.products || [];
        const wishlistProducts = allProducts.filter((p: Product) =>
          wishlistIds.includes(p.id)
        );
        setProducts(wishlistProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }

    if (wishlistIds.length > 0) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [wishlistIds]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (wishlistIds.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-md mx-auto">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-400 blur-3xl opacity-30 rounded-full"></div>
            <Heart className="w-32 h-32 text-pink-300 mx-auto relative z-10 animate-pulse fill-pink-200" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-700 to-rose-700 bg-clip-text text-transparent mb-3">
            Your wishlist is empty
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Start adding products you love! 💕
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-pink-700 hover:via-rose-700 hover:to-pink-700 transition-all shadow-2xl hover:shadow-pink-500/50 font-bold text-lg hover:scale-105 transform duration-300"
          >
            <span>Explore Products</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-700 via-rose-600 to-pink-700 bg-clip-text text-transparent">
                My Wishlist
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              {products.length} {products.length === 1 ? "item" : "items"} you love
            </p>
          </div>
          <button
            onClick={handleMoveAllToCart}
            disabled={products.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 px-6 py-3 text-white font-semibold shadow-lg hover:from-pink-700 hover:via-rose-700 hover:to-pink-700 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart className="w-5 h-5" />
            Move all to cart
          </button>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-pink-50/70 p-4 text-sm text-pink-900">
          <Sparkles className="w-5 h-5 text-pink-500" />
          <span>
            Low-stock & price-drop badges highlight products most likely to sell out or go back to full price soon.
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <div
            key={product.id}
            style={{ animationDelay: `${index * 50}ms` }}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <WishlistItemCard product={product} onMoveToCart={handleMoveToCart} />
          </div>
        ))}
      </div>
    </div>
  );
}

interface WishlistItemCardProps {
  product: Product;
  onMoveToCart: (product: Product) => void;
}

function WishlistItemCard({ product, onMoveToCart }: WishlistItemCardProps) {
  const isLowStock =
    typeof product.stock === "number" && product.stock > 0 && product.stock <= 5;
  const hasPriceDrop =
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.price;
  const discount = hasPriceDrop && product.originalPrice ? calculateDiscount(product.originalPrice, product.price) : 0;

  const similarLink =
    product.category && product.subcategory
      ? `/products/${toSlug(product.category)}/${toSlug(product.subcategory)}`
      : "/products";

  return (
    <div className="space-y-3">
      <div className="relative">
        {(isLowStock || hasPriceDrop) && (
          <div className="pointer-events-none absolute top-4 left-4 z-30 flex flex-col gap-2">
            {isLowStock && (
              <span className="rounded-full bg-amber-500/90 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-lg">
                Only {product.stock} left
              </span>
            )}
            {hasPriceDrop && (
              <span className="rounded-full bg-emerald-600/90 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-lg">
                Price dropped {discount}%
              </span>
            )}
          </div>
        )}
        <ProductCard product={product} />
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onMoveToCart(product)}
          className="min-w-[140px] flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-pink-200 bg-white px-4 py-2 text-sm font-semibold text-pink-700 hover:border-pink-400 hover:bg-pink-50 transition"
        >
          <ShoppingCart className="w-4 h-4" />
          Move to cart
        </button>
        <Link
          href={similarLink}
          className="min-w-[140px] flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:from-purple-700 hover:to-pink-700 transition"
        >
          Buy similar
        </Link>
      </div>
    </div>
  );
}

