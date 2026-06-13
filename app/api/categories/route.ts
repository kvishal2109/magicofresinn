import { NextResponse } from "next/server";
import { listCategories } from "@/lib/supabase/catalog-db";

export const revalidate = 600;

export async function GET() {
  try {
    const categories = await listCategories(false);
    return NextResponse.json({
      success: true,
      categories: categories.filter((c) => c.is_active).map((c) => c.name),
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
