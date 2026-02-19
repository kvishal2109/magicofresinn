"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Tag } from "lucide-react";
import {
  getActiveCoupons,
  getCouponDescription,
  type Coupon,
} from "@/lib/data/coupons";

type Variant = "banner" | "compact";

interface CouponBannerProps {
  /** "banner" = full-width top banner (home). "compact" = smaller strip (checkout/payment). */
  variant?: Variant;
  /** Optional: pass coupons from server. If not set, uses getActiveCoupons() then fetches from /api/coupons to pick up admin-created ones. */
  coupons?: Coupon[] | null;
}

export default function CouponBanner({
  variant = "banner",
  coupons: propCoupons,
}: CouponBannerProps) {
  const [list, setList] = useState<Coupon[]>(() => propCoupons ?? getActiveCoupons());

  useEffect(() => {
    if (propCoupons != null) return;
    fetch("/api/coupons")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.coupons?.length) setList(data.coupons);
      })
      .catch(() => {});
  }, [propCoupons]);

  const displayList = propCoupons ?? list;
  if (displayList.length === 0) return null;

  const checkoutLink = variant === "banner" ? (
    <Link
      href="/checkout"
      className="underline font-bold hover:text-purple-200 transition-colors"
    >
      Apply at checkout
    </Link>
  ) : null;

  if (variant === "compact") {
    return (
      <div className="rounded-xl bg-gradient-to-r from-purple-100 via-pink-50 to-purple-100 border-2 border-purple-200 p-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-purple-600" />
          Available codes:
        </span>
        {displayList.map((c) => (
          <span
            key={c.code}
            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-sm font-mono font-bold text-purple-700"
          >
            {c.code}
            <span className="ml-1.5 text-gray-600 font-normal text-xs">
              {getCouponDescription(c)}
            </span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-700 via-pink-600 to-purple-700 text-white py-2.5 px-4 shadow-md">
      <div className="container mx-auto max-w-7xl flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
        <span className="font-semibold flex items-center gap-1.5">
          <Tag className="w-4 h-4" />
          Use code at checkout:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {displayList.map((c) => (
            <span
              key={c.code}
              className="font-mono font-bold bg-white/20 px-2.5 py-0.5 rounded"
            >
              {c.code}
            </span>
          ))}
        </div>
        {checkoutLink && (
          <span className="text-white/90">
            — {checkoutLink}
          </span>
        )}
      </div>
    </div>
  );
}
