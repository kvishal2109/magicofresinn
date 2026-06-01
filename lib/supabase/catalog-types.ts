export interface DbCatalog {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  cover_image_url?: string | null;
  pdf_url?: string | null;
  type?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbCategory {
  id: string;
  catalog_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbSubcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CatalogTreeSubcategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  productCount: number;
}

export interface CatalogTreeCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  catalogId?: string;
  subcategories: CatalogTreeSubcategory[];
  productCount: number;
}

export interface CatalogTreeCatalog {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  pdfUrl?: string;
  type?: string;
  sortOrder: number;
  categories: CatalogTreeCategory[];
}

export interface CatalogTree {
  catalogs: CatalogTreeCatalog[];
  /** Categories not assigned to any catalog */
  globalCategories: CatalogTreeCategory[];
}
