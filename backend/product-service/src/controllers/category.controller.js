import CategoryService from "../services/category.service.js";

class Category {
    async getCategories(req, res, next) {
        try {
            const result = await CategoryService.getCategories();
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
    
    async createCategory(req, res, next) {
        try {
            const name = req.body.name;
            const result = await CategoryService.createCategory(name);
    
            res.status(201).json({
                message: "Category created successfully",
                category: result
            });
        } catch (err) {
            next(err);
        }
    }
    
    async deleteCategory(req, res, next) {
        try {
            const id = req.params.id;
            const result = await CategoryService.deleteCategory(id);
    
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
}

export default new Category();