import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/admin/auth";
import { getSizeConfigurations } from "@/lib/supabase/sizes";

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const sizeConfigurations = await getSizeConfigurations();
    return NextResponse.json({ sizeConfigurations });
  } catch (error) {
    console.error("Error fetching size configurations:", error);
    return NextResponse.json({ error: "Failed to fetch size configurations" }, { status: 500 });
  }
}
