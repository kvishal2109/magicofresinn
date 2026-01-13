import { NextRequest, NextResponse } from "next/server";
import { updateSizeConfigurations } from "@/lib/supabase/sizes";

export async function PUT(request: NextRequest) {
  try {
    const { sizeConfigurations } = await request.json();
    
    const success = await updateSizeConfigurations(sizeConfigurations);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      throw new Error("Failed to update configurations");
    }
  } catch (error) {
    console.error("Error updating size configurations:", error);
    return NextResponse.json(
      { error: "Failed to update size configurations" },
      { status: 500 }
    );
  }
}