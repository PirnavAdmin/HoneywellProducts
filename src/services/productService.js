import { categories } from '../data/categories';
import { getProductById, products } from '../data/products';

// Mock fallbacks for future GET /api/products, /api/products/{id}, and /api/categories.
export const productService = {
  async list() { return products; },
  async get(id) { return getProductById(id); },
  async categories() { return categories; },
};
