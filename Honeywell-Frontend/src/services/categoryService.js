import {
  fetchCategories,
  fetchCategory,
  saveCategory,
  deleteCategory,
} from '../admin/catalog/catalogApi';

/**
 * Category Service wrapper connecting directly to backend API endpoints:
 * 1. GET (All)   -> GET /api/Category
 * 2. GET (ById)  -> GET /api/Category/{id}
 * 3. POST (Create)-> POST /api/Category
 * 4. PUT (Update) -> PUT /api/Category/{id}
 * 5. DELETE      -> DELETE /api/Category/{id}
 */
export const categoryService = {
  // 1. GET (All)
  async getAll() {
    return await fetchCategories();
  },

  // 2. GET (ById)
  async getById(id) {
    if (!id) return null;
    return await fetchCategory(id);
  },

  // 3. POST (Create)
  async create(categoryData, imageFile = null) {
    return await saveCategory({ ...categoryData, id: undefined, imageFile });
  },

  // 4. PUT (Update)
  async update(id, categoryData, imageFile = null) {
    return await saveCategory({ ...categoryData, id, imageFile });
  },

  // 5. DELETE
  async delete(id) {
    return await deleteCategory(id);
  },

  // Helper compatibility alias
  async list() {
    return await fetchCategories();
  },
  async get(id) {
    return await fetchCategory(id);
  },
};
