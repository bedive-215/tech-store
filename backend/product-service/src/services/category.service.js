import models from "../models/index.js";
import slugify from "slugify";
import { AppError } from "../middlewares/errorHandler.middleware.js";

class CategoryService {
    constructor(Category) {
        this.Category = models.Category;
    }

    async getCategories() {
        const categories = await this.Category.findAll();

        return {
            categories: categories.map(c => ({
                category_id: c.id,
                name: c.name,
                slug: c.slug
            }))
        };
    }

    async createCategory(name) {
        if (!name || !name.trim()) {
            throw new AppError("Category name is required", 400);
        }

        const cleanName = name.trim();
        const slug = slugify(cleanName, { lower: true, strict: true });

        const exists = await this.Category.findOne({ where: { slug } });
        if (exists) {
            throw new AppError("Category already exists", 400);
        }

        const category = await this.Category.create({
            name: cleanName,
            slug
        });

        return {
            category_id: category.id,
            name: category.name,
            slug: category.slug
        };
    }

    async deleteCategory(id) {
        const category = await this.Category.findByPk(id);

        if (!category) {
            throw new AppError("Category not found", 404);
        }

        await category.destroy();

        return {
            status: "deleted",
            category_id: id
        };
    }
}

export default new CategoryService();