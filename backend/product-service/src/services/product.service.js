import models from "../models/index.js";
import { Op } from "sequelize";
import { AppError } from "../middlewares/errorHandler.middleware.js";

const { Product, Brand, Category, ProductMedia, Review, UserInfo } = models;

class ProductService {

    constructor() {
        this.Product = Product;
        this.Brand = Brand;
        this.Category = Category;
        this.ProductMedia = ProductMedia;
        this.UserInfo = UserInfo;
    }

    async getProducts(query) {
        let {
            page = 1,
            limit = 20,
            search = "",
            category,
            brand,
            min_price,
            max_price,
            sort
        } = query;

        page = Number(page) || 1;
        limit = Number(limit) || 20;

        const offset = (page - 1) * limit;

        const where = {};

        if (search) {
            where.name = { [Op.like]: `%${search}%` };
        }

        if (min_price || max_price) {
            where.price = {};
            if (min_price) where.price[Op.gte] = Number(min_price);
            if (max_price) where.price[Op.lte] = Number(max_price);
        }

        const include = [
            {
                model: this.Brand,
                attributes: ["id", "name", "slug"],
                required: !!brand,
                where: brand ? { slug: brand } : undefined
            },
            {
                model: this.Category,
                attributes: ["id", "name", "slug"],
                required: !!category,
                where: category ? { slug: category } : undefined
            },
            {
                model: this.ProductMedia,
                as: "media",
                attributes: ["url", "is_primary"],
                where: { type: "image", is_primary: true },
                required: false,
                limit: 1
            }
        ];

        const sortMap = {
            price_asc: ["price", "ASC"],
            price_desc: ["price", "DESC"],
            rating_desc: ["rating_avg", "DESC"],
            newest: ["created_at", "DESC"]
        };

        let order = [sortMap[sort] || ["created_at", "DESC"]];

        const { rows, count } = await this.Product.findAndCountAll({
            where,
            include,
            limit,
            offset,
            order,
            distinct: true
        });

        const products = rows.map(p => ({
            product_id: p.id,
            name: p.name,
            price: p.price,
            stock: p.stock,
            brand: p.Brand?.name,
            category: p.Category?.name,
            image: p.media?.length ? p.media[0].url : null
        }));

        return { products, total: count, page, limit };
    }

    async getProductById(productId) {
        const product = await this.Product.findOne({
            where: { id: productId },
            include: [
                {
                    model: this.Brand,
                    attributes: ["id", "name"]
                },
                {
                    model: this.Category,
                    attributes: ["id", "name"]
                },
                {
                    model: this.ProductMedia,
                    as: "media",
                    attributes: ["id", "url", "type", "is_primary"]
                }
            ]
        });

        if (!product) throw new AppError("Product not found", 404);

        // Tính average rating chuẩn
        // const reviews = product.reviews || [];
        // const averageRating = reviews.length
        //     ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        //     : 0;

        return {
            product_id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            brand: product.Brand,
            category: product.Category,
            media: product.media,
            // reviews: product.reviews,
            // average_rating: Number(averageRating.toFixed(1))
        };
    }

    async createProduct(data) {
        const { name, description, price, stock, brand_id, category_id } = data;

        if (!name || !price || !brand_id || !category_id) {
            throw new AppError("Missing required fields", 400);
        }

        const brand = await this.Brand.findByPk(brand_id);
        if (!brand) throw new AppError("Brand not found", 404);

        const category = await this.Category.findByPk(category_id);
        if (!category) throw new AppError("Category not found", 404);

        const product = await this.Product.create({
            name,
            description,
            price,
            stock,
            brand_id,
            category_id
        });

        return {
            message: "Product created successfully",
            product: {
                product_id: product.id,
                name: product.name,
                created_at: product.created_at
            }
        };
    }

    async deleteProduct(product_id) {
        const product = await this.Product.findByPk(product_id);

        if (!product) {
            throw new AppError("Product not found", 404);
        }

        await product.destroy();

        return {
            status: "deleted",
            product_id
        };
    }

    async updateProduct(product_id, data) {
        const product = await this.Product.findByPk(product_id);

        if (!product) {
            throw new AppError("Product not found", 404);
        }

        const { name, description, price, stock, brand_id, category_id } = data;

        // Validate brand nếu có truyền vào
        if (brand_id) {
            const brand = await this.Brand.findByPk(brand_id);
            if (!brand) throw new AppError("Brand not found", 404);
        }

        // Validate category nếu có truyền vào
        if (category_id) {
            const category = await this.Category.findByPk(category_id);
            if (!category) throw new AppError("Category not found", 404);
        }

        // Update
        await product.update({
            name: name ?? product.name,
            description: description ?? product.description,
            price: price ?? product.price,
            stock: stock ?? product.stock,
            brand_id: brand_id ?? product.brand_id,
            category_id: category_id ?? product.category_id
        });

        return {
            message: "Product updated successfully",
            product: {
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                stock: product.stock,
                brand_id: product.brand_id,
                category_id: product.category_id,
                updated_at: product.updated_at
            }
        };
    }

}

export default new ProductService();
