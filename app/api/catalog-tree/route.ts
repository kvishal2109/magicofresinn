import { NextResponse } from "next/server";
import { getCatalogTree } from "@/lib/supabase/catalog-db";

export const revalidate = 300;

export async function GET() {
  try {
    const tree = await getCatalogTree(true);
    return NextResponse.json({ success: true, tree });
  } catch (error: any) {
    console.error("Error fetching catalog tree:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch catalog tree" },
      { status: 500 }
    );
  }
}
