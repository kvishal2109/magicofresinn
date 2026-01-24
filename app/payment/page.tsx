"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils/format";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { QrCode, Copy, CheckCircle2, AlertCircle } from "lucide-react";

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const [copied, setCopied] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>("");

  // UPI ID and QR Code from environment or defaults
  const merchantUpiId = process.env.NEXT_PUBLIC_UPI_ID || "shrutikumari21370@okaxis";
  const merchantName = process.env.NEXT_PUBLIC_APP_NAME || "magi.cofresin";
  const qrCodeImage = "/QR/QR.jpg";

  useEffect(() => {
    if (!orderId || !amount) {
      router.push("/cart");
      return;
    }

    // Fetch order details to get order number
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          setOrderNumber(data.order?.orderNumber || "");
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      }
    }
    fetchOrder();
  }, [orderId, amount, router]);

  const copyUpiId = () => {
    navigator.clipboard.writeText(merchantUpiId);
    setCopied(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };



  if (!orderId || !amount) {
    return null;
  }

  const amountNum = parseFloat(amount);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-700 via-pink-600 to-purple-700 bg-clip-text text-transparent">
            Complete Payment
          </h1>
          <p className="text-gray-600 text-lg">Scan the QR code to complete your payment</p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Payment Section - Dynamic based on method */}
          <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-2xl p-8 border-2 border-purple-200 backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">
                Payment Details
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
            </div>

            {orderNumber && (
              <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <p className="text-sm font-semibold text-blue-800">
                  Order Number: <span className="font-bold">{orderNumber}</span>
                </p>
              </div>
            )}

            <div className="text-center mb-6">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {formatCurrency(amountNum)}
              </div>
              <p className="text-gray-600 text-sm font-medium">Please pay the exact amount shown above</p>
            </div>

            {/* QR Code Display */}
            <div className="flex flex-col items-center mb-6">
              <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-purple-200 mb-4">
                <Image
                  src={qrCodeImage}
                  alt="Payment QR Code"
                  width={250}
                  height={250}
                  className="rounded-lg"
                  priority
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                Scan this QR code with any UPI app
              </p>
            </div>

            {/* UPI ID Section */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Or send payment to UPI ID:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={merchantUpiId}
                  readOnly
                  className="flex-1 px-4 py-2 bg-white border-2 border-purple-200 rounded-lg text-gray-800 font-medium text-sm"
                />
                <button
                  onClick={copyUpiId}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-bold shadow-lg hover:shadow-xl hover:scale-105 transform duration-300 flex items-center gap-2 text-sm"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Important Instructions */}
            <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800 mb-1">Important Instructions:</p>
                  <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                    <li>Enter the <strong>exact amount: {formatCurrency(amountNum)}</strong> when making payment</li>
                    <li>Add Order Number <strong>{orderNumber || "from above"}</strong> in payment note/description</li>
                    <li>Do NOT pay less or more than the amount shown</li>
                    <li>Copy the UTR number from your payment receipt</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-gray-600">Loading payment...</div></div>}>
      <PaymentPageContent />
    </Suspense>
  );
}

