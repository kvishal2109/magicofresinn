import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/admin/auth";
import { updateSizeConfigurations } from "@/lib/supabase/sizes";

export async function PUT(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const { sizeConfigurations } = await request.json();
    const success = await updateSizeConfigurations(sizeConfigurations);

    if (!success) {
      throw new Error("Failed to update configurations");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating size configurations:", error);
    return NextResponse.json(
      { error: "Failed to update size configurations" },
      { status: 500 }
    );
  }
}
