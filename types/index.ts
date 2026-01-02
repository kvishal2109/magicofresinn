// Size option for products
export interface ProductSize {
  id: string;
  label: string; // S, M, L, XL
  dimensions: string; // e.g., "20x15 cm"
  priceModifier: number; // Additional price for this size (0 for base price)
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  images?: string[];
  category: string;
  subcategory?: string;
  inStock: boolean;
  stock?: number;
  catalogId?: string;
  catalogName?: string;
  pdfPage?: number;
  pdfItemRef?: string;
  sizes?: ProductSize[]; // Available sizes for this product
  createdAt: Date;
  updatedAt: Date;
}

export interface Catalog {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type?: string;
  pdfFileName?: string;
  coverImage?: string;
  isActive: boolean;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Cart Item Type
export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  selectedSize?: ProductSize; // Selected size for this cart item
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name?: string;
    phone: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  items: CartItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  totalAmount: number;
  paymentStatus: "pending" | "pending_verification" | "paid" | "partial" | "failed";
  orderStatus: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  paymentId?: string;
  // Static QR payment fields
  utrNumber?: string;
  paymentProofUrl?: string;
  paymentSubmittedAt?: Date;
  verifiedAmount?: number; // Amount owner received
  verifiedAt?: Date;
  verifiedBy?: string; // Admin who verified
  createdAt: Date;
  updatedAt: Date;
}

// Checkout Form Data
export interface CheckoutFormData {
  name: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

// Payment Response
export interface PaymentResponse {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
}

