import {
  fetchProducts,
  fetchProductsPaged,
  searchProducts,
  fetchProduct,
  fetchRelatedProducts,
  saveProduct,
  deleteProduct,
  fetchCategories,
} from '../admin/catalog/productsApi';

/**
 * Product Service wrapper connecting directly to backend API endpoints:
 * 1. GET (All)     -> GET /api/products
 * 2. GET (Paged)   -> GET /api/products/paged?page=1&pageSize=12&categoryId=1&sort=price-asc
 * 3. GET (Search)  -> GET /api/products/search?keyword=camera
 * 4. GET (ById)    -> GET /api/products/{id}
 * 5. GET (Related) -> GET /api/products/related/{productId}
 * 6. POST (Create) -> POST /api/products
 * 7. PUT (Update)  -> PUT /api/products/{id}
 * 8. DELETE        -> DELETE /api/products/{id}
 */
export const productService = {
  // 1. GET (All)
  async getAll(categories = [], subcategories = []) {
    return await fetchProducts(categories, subcategories);
  },

  // 2. GET (Paged)
  async getPaged(params = {}) {
    return await fetchProductsPaged(params);
  },

  // 3. GET (Search)
  async search(keyword) {
    if (!keyword || !keyword.trim()) return [];
    return await searchProducts(keyword.trim());
  },

  // 4. GET (ById)
  async getById(id) {
    if (!id) return null;
    return await fetchProduct(id);
  },

  // 5. GET (Related)
  async getRelated(productId) {
    if (!productId) return [];
    return await fetchRelatedProducts(productId);
  },

  // 6. POST (Create)
  async create(productData, imageFiles = [], videoFile = null, posterFile = null) {
    return await saveProduct({ ...productData, id: undefined }, imageFiles, videoFile, posterFile);
  },

  // 7. PUT (Update)
  async update(id, productData, imageFiles = [], videoFile = null, posterFile = null) {
    return await saveProduct({ ...productData, id }, imageFiles, videoFile, posterFile);
  },

  // 8. DELETE
  async delete(id) {
    return await deleteProduct(id);
  },

  // Legacy/Helper alias compatibility
  async list() {
    return await fetchProducts();
  },
  async get(id) {
    return await fetchProduct(id);
  },
  async categories() {
    return await fetchCategories();
  },
};
