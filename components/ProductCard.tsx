"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
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
import { useState, useEffect } from "react";
import SizeSelector from "./SizeSelector";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [inWishlist, setInWishlist] = useState(false);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (hasSizes && !selectedSize) {
      setShowSizeSelector(true);
      toast.error("Please select a size first");
      return;
    }
    
    addToCart(product, 1, selectedSize || undefined);
    const sizeText = selectedSize ? ` (${selectedSize.label})` : "";
    toast.success(`Added to cart${sizeText}!`);
    window.dispatchEvent(new Event("cartUpdated"));
    setShowSizeSelector(false);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const stockCount = typeof product.stock === "number" ? product.stock : null;
  const isOutOfStock = !product.inStock || stockCount === 0;
  const isLowStock = stockCount !== null && stockCount > 0 && stockCount <= 5;

  let inventoryBadgeLabel = "";
  let inventoryBadgeClass = "";
  let inventoryDetailText = "";
  let inventoryDetailClass = "text-emerald-600";

  if (isOutOfStock) {
    inventoryBadgeLabel = "Back soon";
    inventoryBadgeClass = "bg-rose-600 text-white";
    inventoryDetailText = "Back in stock soon";
    inventoryDetailClass = "text-rose-600";
  } else if (isLowStock && stockCount !== null) {
    inventoryBadgeLabel = `Only ${stockCount} left`;
    inventoryBadgeClass = "bg-amber-500 text-white";
    inventoryDetailText = "Selling out fast";
    inventoryDetailClass = "text-amber-600";
  } else if (stockCount !== null) {
    inventoryBadgeLabel = `${stockCount} in stock`;
    inventoryBadgeClass = "bg-emerald-600 text-white";
    inventoryDetailText = "Ready to ship";
    inventoryDetailClass = "text-emerald-600";
  } else if (product.inStock) {
    inventoryBadgeLabel = "Made to order";
    inventoryBadgeClass = "bg-indigo-600 text-white";
    inventoryDetailText = "Crafted on demand";
    inventoryDetailClass = "text-indigo-600";
  } else {
    inventoryBadgeLabel = "Unavailable";
    inventoryBadgeClass = "bg-rose-600 text-white";
    inventoryDetailText = "Back in stock soon";
    inventoryDetailClass = "text-rose-600";
  }

  // Calculate display price based on selected size
  const displayPrice = selectedSize ? product.price + selectedSize.priceModifier : product.price;
  const displayOriginalPrice = selectedSize && product.originalPrice ? product.originalPrice + selectedSize.priceModifier : product.originalPrice;

  return (
    <>
      <Link
        href={`/product/${product.id}`}
        className="group relative bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 border-2 border-purple-100 hover:border-purple-400 hover:scale-[1.03] transform"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Glowing effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 via-pink-400/0 to-purple-400/0 group-hover:from-purple-400/20 group-hover:via-pink-400/20 group-hover:to-purple-400/20 transition-all duration-500 blur-xl"></div>

        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
          {/* Decorative corner accent with animation */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-300/40 via-pink-300/30 to-transparent rounded-bl-full z-0 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-pink-200/30 via-purple-200/20 to-transparent rounded-br-full z-0 group-hover:scale-125 transition-transform duration-700"></div>
          
          <div className="relative w-full h-full z-10">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            
            {/* Overlay gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/0 via-transparent to-transparent group-hover:from-black/10 group-hover:via-transparent group-hover:to-transparent transition-all duration-500"></div>
          </div>
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-2xl border-2 border-white/50 animate-pulse group-hover:scale-110 transition-transform duration-300 z-20">
              <span className="relative z-10">{discount}% OFF</span>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full blur-sm opacity-75 -z-10"></div>
            </div>
          )}
          {inventoryBadgeLabel && (
            <div
              className={`absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-semibold shadow-lg z-20 ${inventoryBadgeClass}`}
            >
              {inventoryBadgeLabel}
            </div>
          )}
          {hasSizes && (
            <div className="absolute bottom-3 right-3 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg z-20">
              Multiple Sizes
            </div>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
              <span className="bg-white/95 px-6 py-3 rounded-xl font-bold text-gray-800 shadow-2xl border-2 border-white">
                Out of Stock
              </span>
            </div>
          )}
          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 p-2.5 bg-white/95 backdrop-blur-md rounded-full hover:bg-white transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-110 z-20 border border-white/50"
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={`w-5 h-5 transition-all duration-300 ${
                inWishlist ? "fill-pink-500 text-pink-500 scale-110 animate-pulse" : "text-gray-600 hover:text-pink-500 hover:scale-110"
              }`}
            />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-5 relative z-10 bg-white/95 backdrop-blur-sm group-hover:bg-white transition-colors duration-300">
          <p className="text-gray-700 text-sm mb-4 line-clamp-2 font-medium leading-relaxed group-hover:text-gray-900 transition-colors">
            {product.description}
          </p>
          
          {/* Size indicator for products with sizes */}
          {hasSizes && selectedSize && (
            <div className="mb-3 text-xs text-purple-600 font-semibold">
              Size: {selectedSize.label} ({selectedSize.dimensions})
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:via-pink-700 group-hover:to-purple-700 transition-all duration-300">
                  {formatCurrency(displayPrice)}
                </span>
                {displayOriginalPrice && (
                  <span className="text-sm text-gray-400 line-through font-medium">
                    {formatCurrency(displayOriginalPrice)}
                  </span>
                )}
              </div>
              <p className={`text-xs font-semibold mt-1 ${inventoryDetailClass}`}>
                {inventoryDetailText}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleWishlistToggle}
                className={`p-2.5 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 ${
                  inWishlist 
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white animate-pulse" 
                    : "bg-gradient-to-r from-pink-100 to-rose-100 text-pink-600 hover:from-pink-500 hover:to-rose-500 hover:text-white"
                }`}
                aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  className={`w-5 h-5 transition-all duration-300 ${
                    inWishlist ? "fill-white scale-110" : ""
                  }`}
                />
              </button>
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="p-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 disabled:hover:scale-100 group/btn"
                aria-label="Add to cart"
              >
                <ShoppingCart className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Size Selector Modal */}
      {showSizeSelector && hasSizes && productSizes && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Select Size</h3>
            <SizeSelector
              sizes={productSizes}
              selectedSize={selectedSize}
              onSizeSelect={setSelectedSize}
              basePrice={product.price}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSizeSelector(false)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:bg-gray-300 transition-all"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

