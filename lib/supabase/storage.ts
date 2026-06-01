import { getSupabaseAdmin, isSupabaseConfigured } from "./client";

const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "store-images";

function extensionFromMime(contentType: string, fallback = "jpg"): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "application/pdf": "pdf",
  };
  return map[contentType] || fallback;
}

export function getStoragePublicUrl(path: string, bucket = DEFAULT_BUCKET): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  }
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

export async function uploadToStorage(
  file: File | Buffer,
  folder: string,
  options?: { contentType?: string; bucket?: string }
): Promise<{ url: string; path: string }> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const bucket = options?.bucket || DEFAULT_BUCKET;
  let buffer: Buffer;
  let contentType = options?.contentType || "image/jpeg";

  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
    contentType = file.type || contentType;
  } else {
    buffer = file;
  }

  const ext = extensionFromMime(contentType);
  const random = Math.random().toString(36).slice(2, 10);
  const path = `${folder}/${Date.now()}-${random}.${ext}`;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return {
    path,
    url: getStoragePublicUrl(path, bucket),
  };
}

export async function deleteFromStorage(
  path: string,
  bucket = DEFAULT_BUCKET
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.error("Error deleting from storage:", error);
  }
}

/** Extract storage path from a Supabase public URL, if applicable */
export function pathFromStorageUrl(url: string, bucket = DEFAULT_BUCKET): string | null {
  try {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.slice(idx + marker.length);
  } catch {
    return null;
  }
}
