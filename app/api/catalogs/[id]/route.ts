import { NextResponse } from "next/server";
import { getCatalogById } from "@/lib/data/catalogs";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export const revalidate = 300;

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const catalog = getCatalogById(id);

  if (!catalog) {
    return NextResponse.json(
      { error: "Catalog not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, catalog });
}
