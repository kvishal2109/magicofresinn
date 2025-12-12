import { NextResponse } from "next/server";
import { getAllCategories } from "@/lib/supabase/products";

// Cache categories API for 10 minutes (categories rarely change)
export const revalidate = 600;

export async function GET() {
  try {
    const categories = await getAllCategories();
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

