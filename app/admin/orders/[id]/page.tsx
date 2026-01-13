"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Order } from "@/types";
import toast from "react-hot-toast";

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState("");

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`);
      const data = await response.json();
      setOrder(data.order);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Failed to load order");
      router.push("/admin/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: Order["orderStatus"]) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Update failed");
      }

      setOrder({ ...order!, orderStatus: newStatus });
      toast.success("Order status updated");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const statusOptions: Order["orderStatus"][] = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ];

  const handlePaymentVerification = async (paymentStatus: "paid" | "partial" | "failed") => {
    if (!receivedAmount || isNaN(parseFloat(receivedAmount))) {
      toast.error("Please enter a valid received amount");
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch("/api/admin/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          verifiedAmount: parseFloat(receivedAmount),
          paymentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Verification failed");
      }

      await fetchOrder(); // Refresh order data
      setReceivedAmount("");
      toast.success("Payment verified successfully");
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Failed to verify payment");
    } finally {
      setVerifying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending_verification":
        return "bg-orange-100 text-orange-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Orders
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
          <p className="text-gray-600 mt-1">Order #{order.orderNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Items
            </h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 border-b pb-4 last:border-0"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      ₹{(item.product.price * item.quantity).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      ₹{item.product.price.toLocaleString()} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Customer Information
            </h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Name:</span>{" "}
                {order.customer.name || "N/A"}
              </p>
              <p>
                <span className="font-medium">Email:</span> {order.customer.email}
              </p>
              <p>
                <span className="font-medium">Phone:</span> {order.customer.phone}
              </p>
              <div className="mt-4">
                <p className="font-medium mb-2">Address:</p>
                <p className="text-gray-700">
                  {order.customer.address.street}
                  <br />
                  {order.customer.address.city}, {order.customer.address.state}{" "}
                  {order.customer.address.pincode}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{order.subtotal.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-green-600">
                    -₹{order.discount.toLocaleString()}
                  </span>
                </div>
              )}
              {order.couponCode && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Coupon</span>
                  <span className="font-medium">{order.couponCode}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-lg">
                  ₹{order.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Status
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Current Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                    order.orderStatus
                  )}`}
                >
                  {order.orderStatus.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Payment Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getPaymentStatusColor(
                    order.paymentStatus
                  )}`}
                >
                  {order.paymentStatus.replace("_", " ").toUpperCase()}
                </span>
              </div>

              {/* Payment Verification Section */}
              {(order.paymentStatus === "pending_verification" || order.paymentStatus === "pending") && (
                <div className="mt-4 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                  <h3 className="font-semibold text-orange-900 mb-3">Payment Verification</h3>
                  
                  {order.utrNumber && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">UTR Number:</span> {order.utrNumber}
                      </p>
                      {order.paymentSubmittedAt && (
                        <p className="text-xs text-gray-500">
                          Submitted: {new Date(order.paymentSubmittedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {order.paymentProofUrl && (
                    <div className="mb-3">
                      <a
                        href={order.paymentProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Payment Screenshot →
                      </a>
                    </div>
                  )}

                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Expected Amount: ₹{order.totalAmount.toLocaleString()}
                    </p>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Received Amount (from bank statement):
                    </label>
                    <input
                      type="number"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      placeholder="Enter received amount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePaymentVerification("paid")}
                      disabled={verifying || !receivedAmount}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                    >
                      Mark as Paid
                    </button>
                    <button
                      onClick={() => handlePaymentVerification("partial")}
                      disabled={verifying || !receivedAmount}
                      className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                    >
                      Partial Payment
                    </button>
                    <button
                      onClick={() => handlePaymentVerification("failed")}
                      disabled={verifying || !receivedAmount}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                    >
                      Failed
                    </button>
                  </div>

                  {order.verifiedAmount && (
                    <p className="text-xs text-gray-600 mt-2">
                      Verified Amount: ₹{order.verifiedAmount.toLocaleString()}
                      {order.verifiedAt && ` on ${new Date(order.verifiedAt).toLocaleString()}`}
                    </p>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </label>
                <select
                  value={order.orderStatus}
                  onChange={(e) =>
                    handleStatusUpdate(e.target.value as Order["orderStatus"])
                  }
                  disabled={updating}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-gray-500">
                <p>Order Date: {new Date(order.createdAt).toLocaleString()}</p>
                <p>Last Updated: {new Date(order.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

