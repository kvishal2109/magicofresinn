import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  const contents = readFileSync(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const LEGACY_CATEGORIES = ["Wedding", "Jewellery", "Home Decor", "Furniture"];
const norm = (value) => value.trim().toLowerCase();
const legacyKeys = new Set(LEGACY_CATEGORIES.map(norm));

async function main() {
  loadEnvLocal();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, category");

  if (productsError) throw productsError;

  const productIdsToDelete = (products || [])
    .filter((row) => row.category && legacyKeys.has(norm(row.category)))
    .map((row) => row.id);

  if (productIdsToDelete.length > 0) {
    const { error: deleteProductsError } = await supabase
      .from("products")
      .delete()
      .in("id", productIdsToDelete);

    if (deleteProductsError) throw deleteProductsError;
  }

  const { data: metadataRows, error: metadataError } = await supabase
    .from("categories_metadata")
    .select("id, category_name");

  if (metadataError) throw metadataError;

  const metadataIdsToDelete = (metadataRows || [])
    .filter((row) => row.category_name && legacyKeys.has(norm(row.category_name)))
    .map((row) => row.id);

  for (const id of metadataIdsToDelete) {
    const { error: deleteMetadataError } = await supabase
      .from("categories_metadata")
      .delete()
      .eq("id", id);

    if (deleteMetadataError) throw deleteMetadataError;
  }

  console.log(
    JSON.stringify(
      {
        deletedProducts: productIdsToDelete.length,
        deletedMetadataRows: metadataIdsToDelete.length,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
