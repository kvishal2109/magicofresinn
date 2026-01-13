"use client";

import { useState, useEffect } from "react";
import { CartItem } from "@/types";
import {
  getCartFromStorage,
  updateCartItemQuantity,
  removeFromCart,
  getCartTotal,
  clearCart,
} from "@/lib/utils/cart";
import { formatCurrency } from "@/lib/utils/format";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const updateCart = () => {
      const cartData = getCartFromStorage();
      setCart(cartData);
      setTotal(getCartTotal(cartData));
    };

    updateCart();
    window.addEventListener("cartUpdated", updateCart);
    window.addEventListener("storage", updateCart);

    return () => {
      window.removeEventListener("cartUpdated", updateCart);
      window.removeEventListener("storage", updateCart);
    };
  }, []);

  const handleQuantityChange = (productId: string, newQuantity: number, sizeId?: string) => {
    const updatedCart = updateCartItemQuantity(productId, newQuantity, sizeId);
    setCart(updatedCart);
    setTotal(getCartTotal(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const handleRemoveItem = (productId: string, sizeId?: string) => {
    const updatedCart = removeFromCart(productId, sizeId);
    setCart(updatedCart);
    setTotal(getCartTotal(updatedCart));
    toast.success("Item removed from cart");
    window.dispatchEvent(new Event("cartUpdated"));
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-md mx-auto">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 blur-3xl opacity-30 rounded-full"></div>
            <ShoppingBag className="w-32 h-32 text-gray-300 mx-auto relative z-10 animate-bounce" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent mb-3">
            Your cart is empty
          </h2>
          <p className="text-gray-600 mb-8 text-lg">Add some beautiful products to get started!</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 transition-all shadow-2xl hover:shadow-purple-500/50 font-bold text-lg hover:scale-105 transform duration-300"
          >
            <span>Continue Shopping</span>
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
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-700 via-pink-600 to-purple-700 bg-clip-text text-transparent">
          Shopping Cart
        </h1>
        <p className="text-gray-600 text-lg">Review your selected items</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-5">
          {cart.map((item, index) => {
            const itemPrice = item.product.price + (item.selectedSize?.priceModifier || 0);
            const itemTotal = itemPrice * item.quantity;
            
            return (
            <div
              key={`${item.productId}-${item.selectedSize?.id || 'no-size'}`}
              className="group bg-white rounded-2xl shadow-xl p-6 flex flex-col sm:flex-row gap-6 border-2 border-purple-100 hover:border-purple-400 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] transform"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Product Image */}
              <div className="relative w-full sm:w-32 h-48 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden border-2 border-purple-100 group-hover:border-purple-300 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50"></div>
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, 128px"
                />
              </div>

              {/* Product Info */}
              <div className="flex-1">
                <h3 className="font-bold text-xl mb-2 text-gray-800 group-hover:text-purple-700 transition-colors">
                  {item.product.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
                  {item.product.description}
                </p>
                
                {/* Size Information */}
                {item.selectedSize && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                      Size: {item.selectedSize.label} ({item.selectedSize.dimensions})
                    </span>
                    {item.selectedSize.priceModifier > 0 && (
                      <span className="ml-2 text-xs text-gray-500">
                        +{formatCurrency(item.selectedSize.priceModifier)}
                      </span>
                    )}
                  </div>
                )}
                
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  {formatCurrency(itemPrice)}
                </p>

                {/* Quantity Controls */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 border-2 border-purple-200 rounded-xl overflow-hidden bg-white shadow-md">
                    <button
                      onClick={() =>
                        handleQuantityChange(item.productId, item.quantity - 1, item.selectedSize?.id)
                      }
                      className="p-2.5 hover:bg-purple-50 transition-colors text-purple-700 hover:text-purple-900"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="px-5 py-2.5 font-bold text-lg min-w-[3.5rem] text-center bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        handleQuantityChange(item.productId, item.quantity + 1, item.selectedSize?.id)
                      }
                      className="p-2.5 hover:bg-purple-50 transition-colors text-purple-700 hover:text-purple-900"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.productId, item.selectedSize?.id)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all hover:scale-110 shadow-md hover:shadow-lg border-2 border-red-200 hover:border-red-300"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Item Total */}
              <div className="text-right sm:text-left sm:mt-0 mt-4">
                <p className="text-sm text-gray-500 mb-1">Total</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {formatCurrency(itemTotal)}
                </p>
              </div>
            </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-2xl p-6 sticky top-24 border-2 border-purple-200 backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">
                Order Summary
              </h2>
              <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-700 font-medium">
                <span>Subtotal</span>
                <span className="font-semibold">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-gray-700 font-medium">
                <span>Shipping</span>
                <span className="text-green-600 font-bold">Free</span>
              </div>
              <div className="border-t-2 border-purple-200 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800">Total</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-700 text-center font-medium">
                  💝 Apply coupon code at checkout
                </p>
              </div>
            </div>
            <Link
              href="/checkout"
              className="block w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white text-center py-4 rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 transition-all font-bold text-lg shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transform duration-300"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

