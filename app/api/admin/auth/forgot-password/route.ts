import { NextRequest, NextResponse } from "next/server";
import { sendAdminPasswordReset } from "@/lib/email/config";

const ADMIN_EMAIL = "shrutikumari21370@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function POST(request: NextRequest) {
  try {
    // Check if email service is configured
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return NextResponse.json(
        {
          error: "Email service is not configured. Please contact the administrator.",
        },
        { status: 503 }
      );
    }

    // Send password recovery email to admin
    await sendAdminPasswordReset(ADMIN_EMAIL, ADMIN_PASSWORD);

    return NextResponse.json({
      success: true,
      message: "Password recovery email sent successfully",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    
    // Provide more specific error messages
    const errorMessage = error?.message || "Failed to send recovery email";
    
    return NextResponse.json(
      {
        error: errorMessage.includes("RESEND_API_KEY") 
          ? "Email service is not configured. Please contact the administrator."
          : "Failed to send recovery email. Please try again later.",
      },
      { status: 500 }
    );
  }
}

