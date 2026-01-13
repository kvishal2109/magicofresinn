import { getSupabaseAdmin } from "./client";

const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

/**
 * Get admin password from Supabase
 */
export async function getAdminPassword(): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('admin_auth')
      .select('password_hash')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data.password_hash;
  } catch (error) {
    console.error("Error fetching admin password:", error);
    return null;
  }
}

/**
 * Save admin password to Supabase
 */
export async function saveAdminPassword(password: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    
    // Check if password exists
    const { data: existing } = await supabase
      .from('admin_auth')
      .select('id')
      .limit(1)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('admin_auth')
        .update({
          password_hash: password,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Insert new
      const { error } = await supabase
        .from('admin_auth')
        .insert({
          password_hash: password,
        });

      if (error) throw error;
    }
  } catch (error) {
    console.error("Error saving admin password:", error);
    throw error;
  }
}

/**
 * Get stored password (from Supabase or env var)
 */
export async function getStoredPassword(): Promise<string> {
  const storedPassword = await getAdminPassword();
  return storedPassword || DEFAULT_ADMIN_PASSWORD;
}

