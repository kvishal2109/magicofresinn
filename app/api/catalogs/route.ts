import { NextResponse } from "next/server";
import { getActiveCatalogs } from "@/lib/data/catalogs";

export const revalidate = 300;

export async function GET() {
  const catalogs = getActiveCatalogs();
  return NextResponse.json({ success: true, catalogs });
}
