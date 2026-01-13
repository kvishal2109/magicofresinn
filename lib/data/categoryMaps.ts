export const CATEGORY_SLUG_TO_NAME: Record<string, string> = {
  "home-decor": "Home Decor",
  "furniture": "Furniture",
  "wedding": "Wedding",
  "jewellery": "Jewellery",
};

export const CATEGORY_NAME_TO_SLUG: Record<string, string> = Object.entries(
  CATEGORY_SLUG_TO_NAME
).reduce((acc, [slug, name]) => {
  acc[name] = slug;
  return acc;
}, {} as Record<string, string>);

export const SUBCATEGORY_SLUG_TO_NAME: Record<string, string> = {
  // Home Decor
  "signature-clock": "Signature Clock",
  "lamps": "Lamps",
  "geode-art": "Geode Art",
  "name-plates": "Name Plates",
  "mantra-frames": "Mantra Frames",
  "spiritual-wall-hangings": "Spiritual Wall Hangings",
  "lotus-pond-wall-hangings": "Lotus Pond Wall Hangings",
  "nature-sceneries-wall-hangings": "Nature/Sceneries Wall Hangings",
  // Furniture
  "gulab-tables": "Gulab Tables",
  "flowers-tables": "Flowers Tables",
  "wine-bottle-tables": "Wine Bottle Tables",
  "designer-tables": "Designer Tables",
  "geode-tables": "Geode Tables",
  "irregular-shaped-tables": "Irregular Shaped Tables",
  "ocean-theme-tables": "Ocean Theme Tables",
  "chess-tables": "Chess Tables",
  // Wedding
  "platters": "Platters",
  "cards-favours": "Cards & Favours",
  "keepsakes": "Keepsakes",
  "frames": "Frames",
  "decor-items": "Decor Items",
  "accessories": "Accessories",
  "presentation-items": "Presentation Items",
  // Jewellery
  "earrings": "Earrings",
  "pendants": "Pendants",
  "rings": "Rings",
  "bracelets-bangles": "Bracelets & Bangles",
  "anklets": "Anklets",
  "floral-jewellery": "Floral Jewellery",
};

export const SUBCATEGORY_NAME_TO_SLUG: Record<string, string> = Object.entries(
  SUBCATEGORY_SLUG_TO_NAME
).reduce((acc, [slug, name]) => {
  acc[name] = slug;
  return acc;
}, {} as Record<string, string>);

export function getCategoryNameFromSlug(slug: string): string | undefined {
  return CATEGORY_SLUG_TO_NAME[slug];
}

export function getSubcategoryNameFromSlug(slug: string): string | undefined {
  return SUBCATEGORY_SLUG_TO_NAME[slug];
}

