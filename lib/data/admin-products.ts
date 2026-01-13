import { Product } from "@/types";
import fs from "fs";
import path from "path";

const PRODUCTS_FILE = path.join(process.cwd(), "data", "admin-products.json");

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read products from JSON file
export function readProductsFromFile(): Product[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(PRODUCTS_FILE)) {
      return [];
    }
    const fileContent = fs.readFileSync(PRODUCTS_FILE, "utf-8");
    const products = JSON.parse(fileContent);
    // Convert date strings back to Date objects
    return products.map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }));
  } catch (error) {
    console.error("Error reading products file:", error);
    return [];
  }
}

// Write products to JSON file
export function writeProductsToFile(products: Product[]): void {
  try {
    ensureDataDir();
    // Convert Date objects to ISO strings for JSON
    const productsToSave = products.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(productsToSave, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing products file:", error);
    throw error;
  }
}

// Get all products
export function getAllProducts(): Product[] {
  return readProductsFromFile();
}

// Get product by ID
export function getProductById(id: string): Product | null {
  const products = readProductsFromFile();
  return products.find((p) => p.id === id) || null;
}

// Create product
export function createProduct(productData: Omit<Product, "id" | "createdAt" | "updatedAt">): string {
  const products = readProductsFromFile();
  const newProduct: Product = {
    ...productData,
    id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  products.push(newProduct);
  writeProductsToFile(products);
  return newProduct.id;
}

// Update product
export function updateProduct(productId: string, updates: Partial<Omit<Product, "id" | "createdAt">>): void {
  const products = readProductsFromFile();
  const index = products.findIndex((p) => p.id === productId);
  
  if (index === -1) {
    throw new Error(`Product with ID "${productId}" not found`);
  }
  
  products[index] = {
    ...products[index],
    ...updates,
    updatedAt: new Date(),
  };
  
  writeProductsToFile(products);
}

// Delete product
export function deleteProduct(productId: string): void {
  const products = readProductsFromFile();
  const filtered = products.filter((p) => p.id !== productId);
  
  if (filtered.length === products.length) {
    throw new Error(`Product with ID "${productId}" not found`);
  }
  
  writeProductsToFile(filtered);
}

// Bulk update prices
export function bulkUpdatePrices(
  updates: Array<{ productId: string; price: number; originalPrice?: number; discount?: number }>
): void {
  const products = readProductsFromFile();
  
  updates.forEach(({ productId, price, originalPrice, discount }) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      product.price = price;
      if (originalPrice !== undefined) product.originalPrice = originalPrice;
      if (discount !== undefined) product.discount = discount;
      product.updatedAt = new Date();
    }
  });
  
  writeProductsToFile(products);
}

// Bulk update inventory
export function bulkUpdateInventory(
  updates: Array<{ productId: string; stock?: number; inStock: boolean }>
): void {
  const products = readProductsFromFile();
  
  updates.forEach(({ productId, stock, inStock }) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      product.inStock = inStock;
      if (stock !== undefined) product.stock = stock;
      product.updatedAt = new Date();
    }
  });
  
  writeProductsToFile(products);
}

