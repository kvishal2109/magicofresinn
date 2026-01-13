import { NextRequest, NextResponse } from "next/server";
import { generateOTP, storeOTP, sendOTPviaSMS } from "@/lib/admin/otp";

const ADMIN_PHONE = process.env.ADMIN_PHONE || "+917355413604"; // Admin phone number

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
  try {
    const { phone } = await request.json();
    
    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }
    
    // Normalize the phone number
    const normalizedPhone = normalizePhoneNumber(phone);
    const normalizedAdminPhone = normalizePhoneNumber(ADMIN_PHONE);
    
    // Validate phone number format (basic validation)
    if (normalizedPhone.length < 10) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }
    
    // Check if phone matches admin phone (compare normalized versions)
    if (normalizedPhone !== normalizedAdminPhone) {
      return NextResponse.json(
        { error: "Phone number not authorized for password reset" },
        { status: 403 }
      );
    }
    
    // Generate and store OTP
    const otp = generateOTP();
    storeOTP(normalizedPhone, otp);
    
    // Send OTP via SMS
    try {
      await sendOTPviaSMS(normalizedPhone, otp);
    } catch (smsError) {
      console.error("Error sending SMS:", smsError);
    }
    
    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      ...(process.env.NODE_ENV === "development" && { otp }),
    });
  } catch (error: any) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      {
        error: "Failed to send OTP. Please try again later.",
      },
      { status: 500 }
    );
  }
}

