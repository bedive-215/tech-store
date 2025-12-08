import models from "../models/index.js";
import { Op } from "sequelize";
import { AppError } from "../middlewares/errorHandler.middleware.js";
import RabbitMQ from "../configs/rabbitmq.config.js";

const { Product, Brand, Category, ProductMedia, Review, UserInfo } = models;

class ProductService {

    constructor() {
        this.Product = Product;
        this.Brand = Brand;
        this.Category = Category;
        this.ProductMedia = ProductMedia;
        this.UserInfo = UserInfo;
        this.RabbitMQ = RabbitMQ;
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

        return {
            product_id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            brand: product.Brand,
            category: product.Category,
            media: product.media,
        };
    }

    async createProduct(data) {
        const { name, description, price, stock, brand_name, category_name } = data;

        if (!name || !price || !brand_name || !category_name) {
            throw new AppError("Missing required fields", 400);
        }

        // Tìm brand theo tên
        const brand = await this.Brand.findOne({
            where: { name: brand_name.trim() }
        });

        if (!brand) throw new AppError("Brand not found", 404);

        // Tìm category theo tên
        const category = await this.Category.findOne({
            where: { name: category_name.trim() }
        });

        if (!category) throw new AppError("Category not found", 404);

        // Tạo product
        const product = await this.Product.create({
            name,
            description,
            price,
            stock: stock ?? 0,
            brand_id: brand.id,
            category_id: category.id
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

        await this.RabbitMQ.publish('delete_product', { product_id });

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

        // Day su kien thay doi vao cart service
        if (stock !== undefined) {
            await this.RabbitMQ.publish('change_stock', { product_id, stock });
        }

        if (price !== undefined) {
            await this.RabbitMQ.publish('change_price', { product_id, price });
        }

        if (name !== undefined) {
            await this.RabbitMQ.publish('change_name', { product_id, name });
        }

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

    async initMessageHandlers() {
        await this.RabbitMQ.subscribe("wishlist_product", async (msg) => {
            const productIds = msg.products;
            const correlationId = msg.correlationId;
            if (productIds.length === 0) {
                return await this.RabbitMQ.publish("product_detail", {
                    products: [],
                    correlationId
                });
            }
            if (!productIds || !Array.isArray(productIds) || !correlationId) {
                console.error("Invalid productIds:", productIds);
                return;
            }

            const products = await this.Product.findAll({
                where: { id: productIds },
                include: [
                    { model: this.Brand, attributes: ["id", "name"] },
                    { model: this.Category, attributes: ["id", "name"] },
                    { model: this.ProductMedia, as: "media", attributes: ["url", "is_primary"] }
                ]
            });

            const result = products.map((p) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                brand: p.Brand?.name,
                category: p.Category?.name,
                media: p.media?.[0]?.url ?? null
            }));

            await this.RabbitMQ.publish("product_detail", {
                products: result,
                correlationId
            });
        });
    }
}

export default new ProductService();
