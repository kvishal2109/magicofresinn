"use client";

import { useEffect, useState } from "react";
import { Product, ProductSize } from "@/types";
import { formatCurrency, calculateDiscount } from "@/lib/utils/format";
import {
  addToCart,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
} from "@/lib/utils/cart";
import { getProductSizes, hasProductSizes } from "@/lib/data/productSizes";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { Heart, ShoppingCart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import SizeSelector from "../SizeSelector";

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [inWishlist, setInWishlist] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  
  const [productSizes, setProductSizes] = useState<ProductSize[] | undefined>(undefined);
  const [hasSizes, setHasSizes] = useState(false);

  useEffect(() => {
    setInWishlist(isInWishlist(product.id));
    
    // Load product sizes asynchronously
    const loadSizes = async () => {
      const sizes = await getProductSizes(product);
      const productHasSizes = await hasProductSizes(product);
      setProductSizes(sizes);
      setHasSizes(productHasSizes);
      
      // Set default size if product has sizes
      if (productHasSizes && sizes && sizes.length > 0) {
        setSelectedSize(sizes[0]);
      }
    };
    
    loadSizes();
  }, [product.id]);

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) {
      toast.error("Please select a size first");
      return;
    }
    
    addToCart(product, quantity, selectedSize || undefined);
    const sizeText = selectedSize ? ` (${selectedSize.label})` : "";
    toast.success(`Added ${quantity} item(s) to cart${sizeText}!`);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(product.id);
      toast.success("Added to wishlist!");
    }
    setInWishlist(!inWishlist);
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const discount = product.originalPrice
    ? calculateDiscount(product.originalPrice, product.price)
    : 0;

  // Calculate display price based on selected size
  const displayPrice = selectedSize ? product.price + selectedSize.priceModifier : product.price;
  const displayOriginalPrice = selectedSize && product.originalPrice ? product.originalPrice + selectedSize.priceModifier : product.originalPrice;

  return (
    <div className="container mx-auto px-4 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-8 font-semibold group transition-all duration-300 hover:scale-105"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Products</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="relative aspect-square bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 rounded-2xl overflow-hidden border-2 border-purple-200 shadow-2xl group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 via-pink-400/0 to-purple-400/0 group-hover:from-purple-400/10 group-hover:via-pink-400/10 group-hover:to-purple-400/10 transition-all duration-500 blur-2xl"></div>
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700 relative z-10"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          {discount > 0 && (
            <div className="absolute top-6 left-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white px-5 py-2 rounded-full text-base font-bold shadow-2xl border-2 border-white/50 z-20 animate-pulse">
              <span className="relative z-10">{discount}% OFF</span>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full blur-sm opacity-75 -z-10"></div>
            </div>
          )}
          {hasSizes && (
            <div className="absolute top-6 right-6 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg z-20">
              Multiple Sizes Available
            </div>
          )}
        </div>

        {/* Product Info - No name, just description */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl p-6 border-2 border-purple-200 shadow-xl">
            <p className="text-xl text-gray-800 leading-relaxed font-medium">{product.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              {formatCurrency(displayPrice)}
            </span>
            {displayOriginalPrice && (
              <>
                <span className="text-2xl text-gray-400 line-through font-semibold">
                  {formatCurrency(displayOriginalPrice)}
                </span>
                <span className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-4 py-2 rounded-xl text-sm font-bold border-2 border-amber-300 shadow-md">
                  💰 Save {formatCurrency(displayOriginalPrice - displayPrice)}
                </span>
              </>
            )}
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-200 space-y-3">
            <p className="text-base text-gray-700 font-medium">
              <span className="font-bold text-purple-700">Category:</span> <span className="text-gray-800">{product.category}</span>
            </p>
            <p className="text-base text-gray-700 font-medium">
              <span className="font-bold text-purple-700">Availability:</span>{" "}
              {product.inStock ? (
                <span className="text-green-600 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  In Stock
                </span>
              ) : (
                <span className="text-red-600 font-bold">Out of Stock</span>
              )}
            </p>
            {product.stock && (
              <p className="text-base text-gray-700 font-medium">
                <span className="font-bold text-purple-700">Stock:</span> <span className="text-gray-800 font-semibold">{product.stock} units</span>
              </p>
            )}
          </div>

          {/* Size Selector */}
          {hasSizes && productSizes && (
            <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl p-6 border-2 border-purple-200 shadow-xl">
              <SizeSelector
                sizes={productSizes}
                selectedSize={selectedSize}
                onSizeSelect={setSelectedSize}
                basePrice={product.price}
              />
            </div>
          )}

          {/* Quantity Selector */}
          {product.inStock && (
            <div className="flex items-center gap-4">
              <label className="font-bold text-gray-700 text-lg">Quantity:</label>
              <div className="flex items-center gap-1 border-2 border-purple-200 rounded-xl overflow-hidden bg-white shadow-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-purple-50 transition-colors text-purple-700 hover:text-purple-900 font-bold"
                  aria-label="Decrease quantity"
                >
                  <span className="w-5 h-5 flex items-center justify-center">-</span>
                </button>
                <span className="px-6 py-3 font-bold text-lg min-w-[4rem] text-center bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 hover:bg-purple-50 transition-colors text-purple-700 hover:text-purple-900 font-bold"
                  aria-label="Increase quantity"
                >
                  <span className="w-5 h-5 flex items-center justify-center">+</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock || (hasSizes && !selectedSize)}
              className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transform duration-300 disabled:hover:scale-100 group"
            >
              <ShoppingCart className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
              Add to Cart
            </button>
            <button
              onClick={handleWishlistToggle}
              className={`p-4 rounded-xl border-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 ${
                inWishlist
                  ? "border-pink-500 bg-gradient-to-r from-pink-500 to-rose-500 text-white animate-pulse"
                  : "border-purple-200 hover:border-pink-400 text-gray-600 hover:text-pink-500 hover:bg-pink-50"
              }`}
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className={`w-6 h-6 transition-all duration-300 ${inWishlist ? "fill-white scale-110" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

