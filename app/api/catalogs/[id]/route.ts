import { NextResponse } from "next/server";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, { params }: Params) {
  await params;
  return NextResponse.json(
    { error: "Catalog not found" },
    { status: 404 }
  );
}
