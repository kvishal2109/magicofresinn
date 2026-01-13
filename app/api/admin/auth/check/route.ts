import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/admin/auth";

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await verifySession();
    return NextResponse.json({ authenticated: isAuthenticated });
  } catch (error) {
    return NextResponse.json({ authenticated: false });
  }
}

