import { Product } from "@/types";
import { getProductsBlob, saveProductsBlob } from "./storage";

/**
 * Get all products from Vercel Blob Storage
 * Falls back to hardcoded products if blob is empty
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const products = await getProductsBlob();
    
    // Convert date strings to Date objects
    const parsedProducts = products.map((p: any) => ({
      ...p,
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    })) as Product[];
    
    // If no products in blob, return hardcoded products
    if (parsedProducts.length === 0) {
      return [];
    }
    
    return parsedProducts;
  } catch (error) {
    console.error("Error fetching products from blob:", error);
    return [];
  }
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const products = await getAllProducts();
    return products.find((p) => p.id === id) || null;
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return null;
  }
}

/**
 * Get products by category
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  try {
    const products = await getAllProducts();
    return products.filter((p) => p.category === category);
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return [];
  }
}

/**
 * Get all categories
 */
export async function getAllCategories(): Promise<string[]> {
  try {
    const products = await getAllProducts();
    if (!products || products.length === 0) {
      return [];
    }

    return [...new Set(products.map((p) => p.category))].sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

/**
 * Admin Functions - Create product
 */
export async function createProduct(
  productData: Omit<Product, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    let products = await getProductsBlob();
    
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    products.push(newProduct);
    await saveProductsBlob(products);
    
    return newProduct.id;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}

/**
 * Admin Functions - Update product
 */
export async function updateProduct(
  productId: string,
  updates: Partial<Omit<Product, "id" | "createdAt">>
): Promise<void> {
  try {
    let products = await getProductsBlob();
    
    const index = products.findIndex((p: any) => p.id === productId);
    
    if (index === -1) {
      throw new Error(`Product with ID "${productId}" not found`);
    }
    
    products[index] = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await saveProductsBlob(products);
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

/**
 * Admin Functions - Delete product
 */
export async function deleteProduct(productId: string): Promise<void> {
  try {
    let products = await getProductsBlob();
    
    const filtered = products.filter((p: any) => p.id !== productId);
    
    if (filtered.length === products.length) {
      throw new Error(`Product with ID "${productId}" not found`);
    }
    
    await saveProductsBlob(filtered);
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

/**
 * Admin Functions - Bulk update prices
 */
export async function bulkUpdatePrices(
  updates: Array<{ productId: string; price: number; originalPrice?: number; discount?: number }>
): Promise<void> {
  try {
    let products = await getProductsBlob();
    
    updates.forEach(({ productId, price, originalPrice, discount }) => {
      const product = products.find((p: any) => p.id === productId);
      if (product) {
        product.price = price;
        if (originalPrice !== undefined) product.originalPrice = originalPrice;
        if (discount !== undefined) product.discount = discount;
        product.updatedAt = new Date().toISOString();
      }
    });
    
    await saveProductsBlob(products);
  } catch (error) {
    console.error("Error bulk updating prices:", error);
    throw error;
  }
}

/**
 * Admin Functions - Bulk update inventory
 */
export async function bulkUpdateInventory(
  updates: Array<{ productId: string; stock?: number; inStock: boolean }>
): Promise<void> {
  try {
    let products = await getProductsBlob();
    
    updates.forEach(({ productId, stock, inStock }) => {
      const product = products.find((p: any) => p.id === productId);
      if (product) {
        product.inStock = inStock;
        if (stock !== undefined) product.stock = stock;
        product.updatedAt = new Date().toISOString();
      }
    });
    
    await saveProductsBlob(products);
  } catch (error) {
    console.error("Error bulk updating inventory:", error);
    throw error;
  }
}

/**
 * Admin Functions - Bulk update category (rename category)
 */
export async function bulkUpdateCategory(
  oldCategory: string,
  newCategory: string
): Promise<void> {
  try {
    let products = await getProductsBlob();
    
    products.forEach((product: any) => {
      if (product.category === oldCategory) {
        product.category = newCategory;
        product.updatedAt = new Date().toISOString();
      }
    });
    
    await saveProductsBlob(products);
  } catch (error) {
    console.error("Error bulk updating category:", error);
    throw error;
  }
}

/**
 * Admin Functions - Delete category (delete all products in category)
 */
export async function deleteCategory(category: string): Promise<void> {
  try {
    let products = await getProductsBlob();
    
    // Filter products - use case-insensitive matching to ensure all products are deleted
    const filtered = products.filter((p: any) => 
      p.category && p.category.toLowerCase() !== category.toLowerCase()
    );
    
    // Check if any products were actually deleted
    if (filtered.length === products.length) {
      // No products were deleted, which means the category doesn't exist
      console.warn(`Category "${category}" not found or has no products`);
    }
    
    await saveProductsBlob(filtered);
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
}

