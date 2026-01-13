import { NextResponse } from "next/server";
import { getSizeConfigurations } from "@/lib/supabase/sizes";

export async function GET() {
  try {
    const sizeConfigurations = await getSizeConfigurations();
    return NextResponse.json({ sizeConfigurations });
  } catch (error) {
    console.error("Error fetching size configurations:", error);
    return NextResponse.json(
      { error: "Failed to fetch size configurations" },
      { status: 500 }
    );
  }
}