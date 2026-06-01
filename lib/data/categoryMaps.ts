/** Generic slug helpers for dynamic categories (no static taxonomy). */

export function toSlug(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export function slugToDisplayName(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
