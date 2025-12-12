import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getStoredPassword, saveAdminPassword } from "@/lib/supabase/auth";

const SESSION_COOKIE_NAME = "admin_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Simple session token generation
function generateSessionToken(): string {
  return Buffer.from(`${Date.now()}-${Math.random()}`).toString("base64");
}

export async function verifyPassword(password: string): Promise<boolean> {
  const storedPassword = await getStoredPassword();
  return password === storedPassword;
}

export async function resetPassword(newPassword: string): Promise<void> {
  await saveAdminPassword(newPassword);
}

// Create session
export async function createSession(response?: NextResponse): Promise<string> {
  const token = generateSessionToken();
  const expires = new Date(Date.now() + SESSION_DURATION);
  
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    expires,
    path: "/",
  };
  
  if (response) {
    response.cookies.set(SESSION_COOKIE_NAME, token, cookieOptions);
  } else {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, cookieOptions);
  }
  
  return token;
}

// Verify session (server-side)
export async function verifySession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME);
    return !!session?.value;
  } catch (error) {
    return false;
  }
}

// Clear session
export async function clearSession(response?: NextResponse): Promise<void> {
  if (response) {
    response.cookies.delete(SESSION_COOKIE_NAME);
  } else {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

// Middleware to protect API routes
export async function requireAuth(
  request: NextRequest
): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!session?.value) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  return null; // Authorized
}

// Client-side session check (for pages)
export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  
  const cookies = document.cookie.split(";");
  const sessionCookie = cookies.find((c) =>
    c.trim().startsWith(`${SESSION_COOKIE_NAME}=`)
  );
  
  if (!sessionCookie) return null;
  
  return sessionCookie.split("=")[1];
}

