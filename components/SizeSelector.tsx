"use client";

import { ProductSize } from "@/types";
import { formatCurrency } from "@/lib/utils/format";

interface SizeSelectorProps {
  sizes: ProductSize[];
  selectedSize: ProductSize | null;
  onSizeSelect: (size: ProductSize) => void;
  basePrice: number;
}

export default function SizeSelector({ 
  sizes, 
  selectedSize, 
  onSizeSelect, 
  basePrice 
}: SizeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="font-bold text-gray-700 text-lg">Size:</label>
      <div className="grid grid-cols-2 gap-3">
        {sizes.map((size) => {
          const isSelected = selectedSize?.id === size.id;
          const totalPrice = basePrice + size.priceModifier;
          
          return (
            <button
              key={size.id}
              onClick={() => onSizeSelect(size)}
              className={`p-3 rounded-xl border-2 transition-all duration-300 text-left ${
                isSelected
                  ? "border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg scale-105"
                  : "border-purple-200 hover:border-purple-400 hover:bg-purple-50"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-purple-700">
                    {size.label} ({size.dimensions})
                  </div>
                  {size.priceModifier > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      +{formatCurrency(size.priceModifier)}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-800">
                    {formatCurrency(totalPrice)}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}