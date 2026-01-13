"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, ArrowLeft, Lock } from "lucide-react";
import toast from "react-hot-toast";

type Step = "phone" | "otp" | "reset" | "success";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [normalizedPhoneNumber, setNormalizedPhoneNumber] = useState(""); // Store normalized phone
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Normalize phone number before sending
  const normalizePhone = (phone: string): string => {
    if (!phone) return "";
    let cleaned = phone.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("+")) return cleaned;
    if (cleaned.length === 10 && /^[789]/.test(cleaned)) return `+91${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith("91")) return `+${cleaned}`;
    return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Normalize phone number before sending
      const normalizedPhone = normalizePhone(phone);
      const response = await fetch("/api/admin/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the normalized phone number for later use
        setNormalizedPhoneNumber(normalizedPhone);
        setStep("otp");
        toast.success("OTP sent successfully!");
        if (data.otp) {
          toast.success(`OTP: ${data.otp}`, { duration: 10000 });
        }
      } else {
        toast.error(data.error || "Failed to send OTP");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs before making request
    if (!normalizedPhoneNumber && !phone) {
      toast.error("Phone number is required");
      return;
    }
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setLoading(true);

    try {
      // Use the stored normalized phone number (from when OTP was sent)
      // If not available, normalize the current phone
      const phoneToUse = normalizedPhoneNumber || normalizePhone(phone);
      
      const response = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneToUse, otp, newPassword }),
      }).catch((fetchError) => {
        // Handle network errors
        console.error("Fetch error:", fetchError);
        throw new Error(`Network error: ${fetchError?.message || "Failed to connect to server"}`);
      });

      let data;
      try {
        const text = await response.text();
        if (!text) {
          throw new Error("Empty response from server");
        }
        data = JSON.parse(text);
      } catch (parseError: any) {
        console.error("Failed to parse response:", {
          status: response.status,
          statusText: response.statusText,
          parseError: parseError?.message || parseError?.toString() || "Unknown parse error",
        });
        toast.error("Invalid response from server. Please try again.");
        setLoading(false);
        return;
      }

      if (response.ok) {
        setStep("success");
        toast.success("Password reset successfully!");
      } else {
        // Show more specific error message
        const errorMsg = data?.error || `Failed to reset password (Status: ${response.status})`;
        toast.error(errorMsg);
        console.error("Password reset error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorMsg,
          phone: phoneToUse,
          otp: otp,
          responseData: data,
        });
      }
    } catch (error: any) {
      // Extract error details properly - handle non-serializable errors
      let errorMessage = "An error occurred. Please try again.";
      let errorDetails: any = {};
      
      try {
        if (error instanceof Error) {
          errorMessage = error.message || error.toString();
          errorDetails = {
            message: error.message,
            name: error.name,
            stack: error.stack,
          };
        } else if (typeof error === 'string') {
          errorMessage = error;
          errorDetails = { message: error };
        } else if (error && typeof error === 'object') {
          errorMessage = error.message || error.error || JSON.stringify(error);
          errorDetails = {
            ...error,
            stringified: JSON.stringify(error, Object.getOwnPropertyNames(error)),
          };
        } else {
          errorMessage = String(error) || "Unknown error";
          errorDetails = { raw: error };
        }
      } catch (extractError) {
        errorMessage = "Failed to process error details";
        errorDetails = { extractionError: extractError };
      }
      
      // Log with multiple methods to ensure we capture the error
      console.error("=== Password Reset Exception ===");
      console.error("Error Message:", errorMessage);
      console.error("Error Type:", typeof error);
      console.error("Is Error Instance:", error instanceof Error);
      console.error("Error Details:", JSON.stringify(errorDetails, null, 2));
      
      // Try to log the raw error in a safe way
      if (error) {
        try {
          console.error("Raw error (stringified):", JSON.stringify(error, Object.getOwnPropertyNames(error)));
        } catch (stringifyError) {
          console.error("Could not stringify error:", stringifyError);
        }
        try {
          console.error("Error toString():", error.toString());
        } catch (toStringError) {
          console.error("Could not call toString():", toStringError);
        }
      }
      console.error("=== End Exception ===");
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      setStep("reset");
    } else {
      toast.error("Please enter a valid 6-digit OTP");
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    handleVerifyOTP(e);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            {step === "phone" || step === "otp" ? (
              <Phone className="w-8 h-8 text-blue-600" />
            ) : (
              <Lock className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-600 mt-2">
            {step === "phone" && "Enter your phone number to receive OTP"}
            {step === "otp" && "Enter the OTP sent to your phone"}
            {step === "reset" && "Enter your new password"}
            {step === "success" && "Password reset successfully!"}
          </p>
        </div>

        {step === "phone" && (
          <>
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+917355413604"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/admin/login"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </>
        )}

        {step === "otp" && (
          <>
            <form onSubmit={handleOTPSubmit} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  OTP sent to {phone}
                </p>
              </div>

              <button
                type="submit"
                disabled={otp.length !== 6}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Verify OTP
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setOtp("");
                  setNormalizedPhoneNumber("");
                  setStep("phone");
                }}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Change phone number
              </button>
            </div>
          </>
        )}

        {step === "reset" && (
          <>
            <form onSubmit={handleResetSubmit} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}

        {step === "success" && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 text-center">
                <strong>Success!</strong> Your password has been reset successfully. You can now login with your new password.
              </p>
            </div>

            <Link
              href="/admin/login"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-center transition-colors"
            >
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
