import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/admin/otp";
import { resetPassword } from "@/lib/admin/auth";

const ADMIN_PHONE = process.env.ADMIN_PHONE || "+917355413604";

// Normalize phone number to standard format
function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, "");
  
  // If it starts with +, keep it
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  
  // If it's 10 digits and starts with 7, 8, or 9, assume it's Indian and add +91
  if (cleaned.length === 10 && /^[789]/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  
  // If it's 12 digits and starts with 91, add +
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+${cleaned}`;
  }
  
  // Otherwise return as is
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

export async function POST(request: NextRequest) {
  let phone: string | undefined;
  try {
    const body = await request.json();
    phone = body.phone;
    const { otp, newPassword } = body;
    
    // Validate inputs
    if (!phone || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Phone number, OTP, and new password are required" },
        { status: 400 }
      );
    }
    
    // Normalize phone numbers for comparison
    const normalizedPhone = normalizePhoneNumber(phone);
    const normalizedAdminPhone = normalizePhoneNumber(ADMIN_PHONE);
    
    // Validate phone number
    if (normalizedPhone !== normalizedAdminPhone) {
      return NextResponse.json(
        { error: "Phone number not authorized" },
        { status: 403 }
      );
    }
    
    // Validate new password
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }
    
    // Verify OTP (use normalized phone for lookup)
    const isValidOTP = verifyOTP(normalizedPhone, otp);
    if (!isValidOTP) {
      return NextResponse.json(
        { error: "Invalid or expired OTP. Please request a new OTP." },
        { status: 401 }
      );
    }
    
    // Reset password
    try {
      await resetPassword(newPassword);
    } catch (passwordError: any) {
      console.error("Error saving password:", passwordError);
      throw passwordError; // Re-throw to be caught by outer catch
    }
    
    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    const errorPhone = phone || "unknown";
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      phone: errorPhone,
      normalizedPhone: normalizePhoneNumber(errorPhone),
    });
    
    // Provide more specific error messages
    let errorMessage = "Failed to reset password. Please try again later.";
    if (error?.message?.includes("suspended")) {
      errorMessage = "Storage service is unavailable. Please contact support.";
    } else if (error?.message?.includes("blob")) {
      errorMessage = "Failed to save password. Please try again.";
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

