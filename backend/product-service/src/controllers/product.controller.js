import productService from "../services/product.service.js";

class ProductController {

    async getProducts(req, res, next) {
        try {
            const result = await productService.getProducts(req.query);
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async getProductById(req, res, next) {
        try {
            const { id } = req.params;
            const result = await productService.getProductById(id);

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async createProduct(req, res, next) {
        try {
            const result = await productService.createProduct(req.body);

            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async deleteProduct(req, res, next) {
        try {
            const { id } = req.params;
            const result = await productService.deleteProduct(id);

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async updateProduct(req, res, next) {
        try {
            const { id } = req.params;
            const result = await productService.updateProduct(id, req.body);

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
}

export default new ProductController();