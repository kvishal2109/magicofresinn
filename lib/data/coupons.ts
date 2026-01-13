// Hardcoded discount coupons
// TODO: Move to Vercel Blob Storage when admin panel is ready

export interface Coupon {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number; // Percentage (e.g., 10) or fixed amount (e.g., 100)
  minPurchase?: number; // Minimum purchase amount to apply coupon
  maxDiscount?: number; // Maximum discount amount (for percentage)
  validFrom?: Date;
  validUntil?: Date;
  isActive: boolean;
}

export const coupons: Coupon[] = [
  {
    code: "WELCOME10",
    discountType: "percentage",
    discountValue: 10,
    minPurchase: 500,
    maxDiscount: 200,
    isActive: true,
  },
  {
    code: "SAVE20",
    discountType: "percentage",
    discountValue: 20,
    minPurchase: 1000,
    maxDiscount: 500,
    isActive: true,
  },
  {
    code: "FLAT100",
    discountType: "fixed",
    discountValue: 100,
    minPurchase: 500,
    isActive: true,
  },
  {
    code: "FLAT500",
    discountType: "fixed",
    discountValue: 500,
    minPurchase: 2000,
    isActive: true,
  },
  {
    code: "NEWUSER",
    discountType: "percentage",
    discountValue: 15,
    minPurchase: 0,
    maxDiscount: 300,
    isActive: true,
  },
];

// Validate and get coupon
export function validateCoupon(code: string, totalAmount: number): {
  valid: boolean;
  coupon?: Coupon;
  discountAmount?: number;
  error?: string;
} {
  const coupon = coupons.find(
    (c) => c.code.toUpperCase() === code.toUpperCase() && c.isActive
  );

  if (!coupon) {
    return { valid: false, error: "Invalid coupon code" };
  }

  // Check minimum purchase
  if (coupon.minPurchase && totalAmount < coupon.minPurchase) {
    return {
      valid: false,
      error: `Minimum purchase of ₹${coupon.minPurchase} required`,
    };
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = (totalAmount * coupon.discountValue) / 100;
    if (coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }
  } else {
    discountAmount = coupon.discountValue;
  }

  // Ensure discount doesn't exceed total
  discountAmount = Math.min(discountAmount, totalAmount);

  return {
    valid: true,
    coupon,
    discountAmount: Math.round(discountAmount),
  };
}

