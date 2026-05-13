import { Catalog } from "@/types";

const baseTimestamp = new Date("2024-09-01T10:00:00Z");

export const catalogs: Catalog[] = [
  {
    id: "catalog-home-decor-2024",
    name: "Home Decor Collection",
    slug: "home-decor",
    description: "A curated catalog of our best-selling home decor pieces, clocks, lamps, and wall art.",
    type: "pdf",
    pdfFileName: "Catalog (Home Decor).Pdf.1.pdf",
    coverImage: "/sh.jpeg",
    isActive: true,
    sortOrder: 10,
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
  {
    id: "catalog-weddings-2024",
    name: "Wedding & Gifts Catalog",
    slug: "weddings",
    description: "Discover wedding platters, keepsakes, favors, and celebration-ready presents designed in resin.",
    type: "pdf",
    pdfFileName: "Catalog(Weddings with price).1.pdf",
    coverImage: "/sh.jpeg",
    isActive: true,
    sortOrder: 20,
    createdAt: new Date(baseTimestamp.getTime() + 3600 * 1000),
    updatedAt: new Date(baseTimestamp.getTime() + 3600 * 1000),
  },
];

export function getActiveCatalogs(): Catalog[] {
  return catalogs.filter((catalog) => catalog.isActive);
}

export function getCatalogById(id: string): Catalog | undefined {
  return catalogs.find((catalog) => catalog.id === id);
}
