import models from "../models/index.js";
import { Op } from "sequelize";
import { AppError } from "../middlewares/errorHandler.middleware.js";
import RabbitMQ from "../configs/rabbitmq.config.js";
import sequelize from "../configs/db.config.js";

const { Product, Brand, Category, ProductMedia, FlashSale, FlashSaleItem } = models;

class ProductService {

    constructor() {
        this.Product = Product;
        this.Brand = Brand;
        this.Category = Category;
        this.ProductMedia = ProductMedia;
        this.RabbitMQ = RabbitMQ;
        this.FlashSale = FlashSale;
        this.FlashSaleItem = FlashSaleItem;
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
        const now = new Date();

        const where = {};
        if (search) where.name = { [Op.like]: `%${search}%` };
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
            },
            {
                model: this.FlashSaleItem,
                as: "FlashSaleItems",
                attributes: ["sale_price", "stock_limit"],
                required: false,
                include: [
                    {
                        model: this.FlashSale,
                        as: "flash_sale",
                        attributes: ["id", "name", "start_at", "end_at"],
                        where: {
                            start_at: { [Op.lte]: now },
                            end_at: { [Op.gte]: now }
                        },
                        required: false
                    }
                ]
            }
        ];

        const sortMap = {
            price_asc: ["price", "ASC"],
            price_desc: ["price", "DESC"],
            rating_desc: ["rating_avg", "DESC"],
            newest: ["created_at", "DESC"]
        };
        const order = [sortMap[sort] || ["created_at", "DESC"]];

        const { rows, count } = await this.Product.findAndCountAll({
            where,
            include,
            limit,
            offset,
            order,
            distinct: true
        });

        const products = rows.map(p => {
            const flashSaleItem = p.FlashSaleItems?.[0];
            const flash_sale = flashSaleItem?.flash_sale
                ? {
                    sale_price: flashSaleItem.sale_price,
                    stock_limit: flashSaleItem.stock_limit,
                    flash_sale_id: flashSaleItem.flash_sale.id,
                    flash_sale_name: flashSaleItem.flash_sale.name,
                    start_at: flashSaleItem.flash_sale.start_at,
                    end_at: flashSaleItem.flash_sale.end_at
                }
                : null;

            return {
                product_id: p.id,
                name: p.name,
                price: p.price, // luôn giữ giá gốc
                stock: p.stock,
                brand: p.Brand?.name,
                category: p.Category?.name,
                image: p.media?.length ? p.media[0].url : null,
                flash_sale // kèm flash sale nếu có, null nếu không
            };
        });

        return { products, total: count, page, limit };
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
        const now = new Date();

        const where = {};
        if (search) where.name = { [Op.like]: `%${search}%` };
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
            },
            {
                model: this.FlashSaleItem,
                as: "FlashSaleItems",
                attributes: ["sale_price", "stock_limit"],
                required: false,
                include: [
                    {
                        model: this.FlashSale,
                        as: "flash_sale",
                        attributes: ["id", "name", "start_at", "end_at"],
                        where: {
                            start_at: { [Op.lte]: now },
                            end_at: { [Op.gte]: now }
                        },
                        required: false
                    }
                ]
            }
        ];

        const sortMap = {
            price_asc: ["price", "ASC"],
            price_desc: ["price", "DESC"],
            rating_desc: ["rating_avg", "DESC"],
            newest: ["created_at", "DESC"]
        };
        const order = [sortMap[sort] || ["created_at", "DESC"]];

        const { rows, count } = await this.Product.findAndCountAll({
            where,
            include,
            limit,
            offset,
            order,
            distinct: true
        });

        const products = rows.map(p => {
            const flashSaleItem = p.FlashSaleItems?.[0];
            const flash_sale = flashSaleItem?.flash_sale
                ? {
                    sale_price: flashSaleItem.sale_price,
                    stock_limit: flashSaleItem.stock_limit,
                    flash_sale_id: flashSaleItem.flash_sale?.id,
                    flash_sale_name: flashSaleItem.flash_sale?.name,
                    start_at: flashSaleItem.flash_sale?.start_at,
                    end_at: flashSaleItem.flash_sale?.end_at
                }
                : null;

            return {
                product_id: p.id,
                name: p.name,
                price: p.price, // luôn giữ giá gốc
                stock: p.stock,
                brand: p.Brand?.name,
                category: p.Category?.name,
                image: p.media?.length ? p.media[0].url : null,
                flash_sale
            };
        });


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
        await this.RabbitMQ.subscribe("wishlist_product_queue", async (data, rk) => {
            if (rk === 'wishlist_product') {
                const productIds = data.products;
                const correlationId = data.correlationId;
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
            }
        });

        await this.RabbitMQ.subscribe('check_price_queue', async (data, rk) => {
            if (rk !== 'check_price') return;
            try {
                const { product_id: productIds, correlationId } = data;

                if (!correlationId || !Array.isArray(productIds)) {
                    console.error('[CHECK_PRICE] invalid payload', data);
                    return;
                }

                if (productIds.length === 0) {
                    await this.RabbitMQ.publish('price_result', {
                        products: [],
                        correlationId
                    });
                    return;
                }

                const now = new Date();

                // product gốc
                const products = await this.Product.findAll({
                    where: { id: productIds },
                    attributes: ['id', 'price', 'stock', 'name'],
                    raw: true
                });

                const productMap = new Map(products.map(p => [p.id, p]));

                // Lấy flash sale items đang active
                const flashSaleItems = await this.FlashSaleItem.findAll({
                    include: [{
                        model: this.FlashSale,
                        as: 'flash_sale',
                        where: {
                            start_at: { [Op.lte]: now },
                            end_at: { [Op.gte]: now }
                        },
                        attributes: []
                    }],
                    where: {
                        product_id: productIds
                    },
                    attributes: ['product_id', 'sale_price', 'stock_limit'],
                    raw: true
                });

                // Map flash sale theo product_id
                const flashMap = new Map();

                for (const fs of flashSaleItems) {
                    const current = flashMap.get(fs.product_id);
                    // lấy giá sale thấp nhất nếu có nhiều flash sale
                    if (!current || Number(fs.sale_price) < Number(current.sale_price)) {
                        flashMap.set(fs.product_id, fs);
                    }
                }

                // Merge kết quả
                const result = productIds.map(id => {
                    const product = productMap.get(id);
                    if (!product) {
                        return { id, exists: false };
                    }

                    const flash = flashMap.get(id);

                    if (flash) {
                        return {
                            id,
                            name: product.name,
                            exists: true,
                            price: Number(flash.sale_price),
                            stock: Number(flash.stock_limit),
                            is_flash_sale: true
                        };
                    }

                    return {
                        id,
                        exists: true,
                        name: product.name,
                        price: Number(product.price),
                        stock: Number(product.stock),
                        is_flash_sale: false
                    };
                });
                // console.log(result);
                await this.RabbitMQ.publish('price_result', {
                    products: result,
                    correlationId
                });

            } catch (err) {
                console.error('[CHECK_PRICE] error', err);
            }
        });

        await this.RabbitMQ.subscribe('reserve_stock_queue', async (data, rk) => {
            try {
                switch (rk) {
                    case 'reserve_stock':
                        await this.handleReserveStock(data);
                        break;

                    case 'restore_stock':
                        await this.handleRestoreStock(data);
                        break;

                    default:
                        console.warn('[STOCK] unknown routing key:', rk);
                }
            } catch (err) {
                console.error('[STOCK] handler error', err);
            }
        });
    }

    async handleReserveStock(data) {
        const { order_id, items, correlationId } = data;

        const t = await sequelize.transaction();
        const changedProducts = [];

        try {
            for (const { product_id, quantity } of items) {
                const product = await Product.findOne({
                    where: { id: product_id },
                    lock: t.LOCK.UPDATE,
                    transaction: t
                });

                if (!product) throw new Error(`Product ${product_id} not found`);
                if (product.stock < quantity)
                    throw new Error(`Product ${product_id} insufficient stock`);

                const newStock = product.stock - quantity;

                await product.update(
                    { stock: newStock },
                    { transaction: t }
                );

                changedProducts.push({ product_id, stock: newStock });
            }

            await t.commit();

            await RabbitMQ.publish('stock_reserved', { order_id, correlationId });

            for (const p of changedProducts) {
                await RabbitMQ.publish('change_stock', p);
            }

        } catch (err) {
            await t.rollback();

            await RabbitMQ.publish('stock_failed', {
                order_id,
                reason: err.message
            });
        }
    }

    async handleReserveStock(data) {
        const { order_id, items, correlationId } = data;

        if (!order_id || !correlationId || !Array.isArray(items)) {
            console.error('[RESERVE_STOCK] invalid payload', data);
            return;
        }

        const t = await sequelize.transaction();
        const changedProducts = [];

        try {
            for (const { product_id, quantity } of items) {
                const product = await Product.findOne({
                    where: { id: product_id },
                    lock: t.LOCK.UPDATE,
                    transaction: t
                });

                if (!product)
                    throw new Error(`Product ${product_id} not found`);

                if (product.stock < quantity)
                    throw new Error(`Product ${product_id} insufficient stock`);

                const newStock = product.stock - quantity;

                await product.update({ stock: newStock }, { transaction: t });

                changedProducts.push({ product_id, stock: newStock });
            }

            await t.commit();

            await RabbitMQ.publish('stock_reserved', {
                order_id,
                correlationId
            });

            // sync cart
            for (const p of changedProducts) {
                await RabbitMQ.publish('change_stock', p);
            }

        } catch (err) {
            await t.rollback();

            await RabbitMQ.publish('stock_failed', {
                order_id,
                correlationId,
                reason: err.message
            });
        }
    }

}

export default new ProductService();