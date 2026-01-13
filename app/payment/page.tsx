"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils/format";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { QrCode, Copy, CheckCircle2, Upload, AlertCircle, Smartphone } from "lucide-react";

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const [copied, setCopied] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"qr" | "upi">("qr");
  const [userUpiId, setUserUpiId] = useState("");
  const [validatingUpi, setValidatingUpi] = useState(false);
  const [upiValidated, setUpiValidated] = useState(false);

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

  // Validate UPI ID format
  const validateUpiIdFormat = (upi: string): boolean => {
    // UPI ID format: username@bank (e.g., user@paytm, 9876543210@ybl)
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    return upiRegex.test(upi);
  };

  const handleValidateUpi = () => {
    const trimmedUpi = userUpiId.trim().toLowerCase();
    
    if (!trimmedUpi) {
      toast.error("Please enter your UPI ID");
      return;
    }

    if (!validateUpiIdFormat(trimmedUpi)) {
      toast.error("Invalid UPI ID format. Example: username@paytm or 9876543210@ybl");
      return;
    }

    setValidatingUpi(true);
    // Simulate validation (in real scenario, you might verify with payment gateway)
    setTimeout(() => {
      setUpiValidated(true);
      setValidatingUpi(false);
      toast.success("UPI ID validated successfully!");
    }, 1000);
  };

  const handlePayWithUpi = () => {
    if (!upiValidated) {
      toast.error("Please validate your UPI ID first");
      return;
    }

    const amountNum = parseFloat(amount || "0");
    
    // Generate UPI deep link
    const upiLink = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${amountNum}&cu=INR&tn=${encodeURIComponent(`Order ${orderNumber} - ${merchantName}`)}`;

    // Try to open UPI app
    try {
      // Create a temporary link and click it
      const link = document.createElement('a');
      link.href = upiLink;
      link.click();
      
      toast.success("Opening your UPI app...", { duration: 3000 });
      
      // Show instruction to enter UTR after payment
      setTimeout(() => {
        toast("Please complete the payment and enter the UTR number below", {
          duration: 5000,
          icon: "💡",
        });
      }, 2000);
    } catch (error) {
      console.error("Error opening UPI app:", error);
      toast.error("Could not open UPI app. Please try QR code method.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      setPaymentProof(file);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!utrNumber.trim() && !paymentProof) {
      toast.error("Please provide either UTR number or payment screenshot");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("orderId", orderId!);
      if (utrNumber.trim()) {
        formData.append("utrNumber", utrNumber.trim());
      }
      if (paymentProof) {
        formData.append("paymentProof", paymentProof);
      }

      const response = await fetch("/api/payment/confirm", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit payment");
      }

      toast.success("Payment details submitted! We'll verify and confirm your order soon.");
      router.push(`/order-success?orderId=${orderId}`);
    } catch (error: any) {
      console.error("Payment submission error:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
          <p className="text-gray-600 text-lg">Choose your preferred payment method</p>
        </div>

        {/* Payment Method Selector */}
        <div className="mb-8 flex justify-center gap-4">
          <button
            onClick={() => setPaymentMethod("qr")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              paymentMethod === "qr"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105"
                : "bg-white border-2 border-purple-200 text-gray-700 hover:border-purple-400"
            }`}
          >
            <QrCode className="w-5 h-5 inline mr-2" />
            Scan QR Code
          </button>
          <button
            onClick={() => setPaymentMethod("upi")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              paymentMethod === "upi"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105"
                : "bg-white border-2 border-purple-200 text-gray-700 hover:border-purple-400"
            }`}
          >
            <Smartphone className="w-5 h-5 inline mr-2" />
            Pay with UPI App
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Section - Dynamic based on method */}
          <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-2xl p-8 border-2 border-purple-200 backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">
                {paymentMethod === "qr" ? "Payment Details" : "Pay with UPI App"}
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

            {paymentMethod === "qr" ? (
              <>
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
              </>
            ) : (
              <>
                {/* UPI App Payment */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Enter Your UPI ID *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={userUpiId}
                        onChange={(e) => {
                          setUserUpiId(e.target.value.toLowerCase());
                          setUpiValidated(false);
                        }}
                        placeholder="e.g., yourname@paytm or 9876543210@ybl"
                        disabled={upiValidated}
                        className="flex-1 px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-white shadow-md font-medium disabled:bg-gray-100"
                      />
                      {!upiValidated ? (
                        <button
                          onClick={handleValidateUpi}
                          disabled={validatingUpi}
                          className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-bold shadow-lg hover:scale-105 transform duration-300 disabled:opacity-50"
                        >
                          {validatingUpi ? "..." : "Validate"}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setUpiValidated(false);
                            setUserUpiId("");
                          }}
                          className="px-5 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all font-bold"
                        >
                          Change
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {upiValidated ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          UPI ID validated successfully
                        </span>
                      ) : (
                        "Enter your UPI ID (e.g., yourname@paytm, 9876543210@ybl, user@oksbi)"
                      )}
                    </p>
                  </div>

                  {upiValidated && (
                    <button
                      onClick={handlePayWithUpi}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold text-lg shadow-2xl hover:scale-105 transform duration-300 flex items-center justify-center gap-2"
                    >
                      <Smartphone className="w-6 h-6" />
                      Open UPI App to Pay {formatCurrency(amountNum)}
                    </button>
                  )}

                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-800 font-medium">
                      💡 Click the button above to open your UPI app directly. After making the payment, return here and enter the UTR/Transaction ID below.
                    </p>
                  </div>
                </div>
              </>
            )}

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

          {/* Payment Confirmation Form */}
          <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-2xl p-8 border-2 border-purple-200 backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">
                Confirm Payment
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  UTR / Transaction Reference Number *
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="Enter UTR number from payment receipt"
                  required
                  className="w-full px-5 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-white shadow-md focus:shadow-lg transition-all text-gray-800 font-medium"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can find this in your payment receipt or UPI app transaction history
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Screenshot (Optional)
                </label>
                <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 text-center hover:border-purple-400 transition-all">
                  <input
                    type="file"
                    id="payment-proof"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="payment-proof"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {paymentProof ? paymentProof.name : "Click to upload payment screenshot"}
                    </span>
                    <span className="text-xs text-gray-500">
                      PNG, JPG up to 5MB
                    </span>
                  </label>
                </div>
                {paymentProof && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>File selected: {paymentProof.name}</span>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800 font-medium">
                  💡 After making the payment, please provide the UTR number (required) and optionally upload a screenshot of your payment confirmation. This helps us verify your payment quickly.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white py-4 rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transform duration-300 disabled:hover:scale-100"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "Submit Payment Details"
                )}
              </button>
            </form>
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

