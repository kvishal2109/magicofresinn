import { CartItem, Product, ProductSize } from "@/types";

const CART_STORAGE_KEY = "ecommerce_cart";
const WISHLIST_STORAGE_KEY = "ecommerce_wishlist";

// Cart Utilities
// Using sessionStorage instead of localStorage so each visitor starts fresh
// Perfect for Instagram bio links - clears when tab closes, persists during session
export function getCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  
  try {
    const cartData = sessionStorage.getItem(CART_STORAGE_KEY);
    return cartData ? JSON.parse(cartData) : [];
  } catch (error) {
    console.error("Error reading cart from storage:", error);
    return [];
  }
}

export function saveCartToStorage(cart: CartItem[]): void {
  if (typeof window === "undefined") return;
  
  try {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Error saving cart to storage:", error);
  }
}

export function addToCart(product: Product, quantity: number = 1, selectedSize?: ProductSize): CartItem[] {
  const cart = getCartFromStorage();
  
  // Create a unique key for cart items that includes size
  const cartKey = selectedSize ? `${product.id}-${selectedSize.id}` : product.id;
  
  const existingItemIndex = cart.findIndex(
    (item) => {
      const itemKey = item.selectedSize ? `${item.productId}-${item.selectedSize.id}` : item.productId;
      return itemKey === cartKey;
    }
  );
  
  if (existingItemIndex >= 0) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    cart.push({
      productId: product.id,
      product,
      quantity,
      selectedSize,
    });
  }
  
  saveCartToStorage(cart);
  return cart;
}

export function removeFromCart(productId: string, sizeId?: string): CartItem[] {
  const cart = getCartFromStorage();
  const updatedCart = cart.filter((item) => {
    if (sizeId) {
      return !(item.productId === productId && item.selectedSize?.id === sizeId);
    }
    return item.productId !== productId;
  });
  saveCartToStorage(updatedCart);
  return updatedCart;
}

export function updateCartItemQuantity(
  productId: string,
  quantity: number,
  sizeId?: string
): CartItem[] {
  const cart = getCartFromStorage();
  const itemIndex = cart.findIndex((item) => {
    if (sizeId) {
      return item.productId === productId && item.selectedSize?.id === sizeId;
    }
    return item.productId === productId;
  });
  
  if (itemIndex >= 0) {
    if (quantity <= 0) {
      return removeFromCart(productId, sizeId);
    }
    cart[itemIndex].quantity = quantity;
    saveCartToStorage(cart);
  }
  
  return cart;
}

export function clearCart(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CART_STORAGE_KEY);
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce(
    (total, item) => {
      const basePrice = item.product.price;
      const sizeModifier = item.selectedSize?.priceModifier || 0;
      const itemPrice = basePrice + sizeModifier;
      return total + itemPrice * item.quantity;
    },
    0
  );
}

export function getCartItemCount(cart: CartItem[]): number {
  return cart.reduce((count, item) => count + item.quantity, 0);
}

// Wishlist Utilities
// Using sessionStorage instead of localStorage so each visitor starts fresh
// Perfect for Instagram bio links - clears when tab closes, persists during session
export function getWishlistFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  
  try {
    const wishlistData = sessionStorage.getItem(WISHLIST_STORAGE_KEY);
    return wishlistData ? JSON.parse(wishlistData) : [];
  } catch (error) {
    console.error("Error reading wishlist from storage:", error);
    return [];
  }
}

export function saveWishlistToStorage(wishlist: string[]): void {
  if (typeof window === "undefined") return;
  
  try {
    sessionStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
  } catch (error) {
    console.error("Error saving wishlist to storage:", error);
  }
}

export function addToWishlist(productId: string): string[] {
  const wishlist = getWishlistFromStorage();
  if (!wishlist.includes(productId)) {
    wishlist.push(productId);
    saveWishlistToStorage(wishlist);
  }
  return wishlist;
}

export function removeFromWishlist(productId: string): string[] {
  const wishlist = getWishlistFromStorage();
  const updatedWishlist = wishlist.filter((id) => id !== productId);
  saveWishlistToStorage(updatedWishlist);
  return updatedWishlist;
}

export function isInWishlist(productId: string): boolean {
  const wishlist = getWishlistFromStorage();
  return wishlist.includes(productId);
}

