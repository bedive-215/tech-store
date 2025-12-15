import models from "../models/index.js";
import { AppError } from "../middlewares/errorHandler.middleware.js";
import RabbitMQ from "../configs/rabbitmq.config.js";
import crypto from "crypto";

class WishlistService {
    constructor() {
        this.Wishlist = models.Wishlist;
        this.User = models.User;
        this.RabbitMQ = RabbitMQ;
        this._promiseMap = new Map();
    }

    async addWishlist(user_id, product_id) {
        if (!user_id || !product_id)
            throw new AppError('User id or product id are required', 400);

        const exist = await this.Wishlist.findOne({
            where: { user_id, product_id }
        });

        if (exist) throw new AppError('This product already exists in your wishlist', 400);

        const wishlist = await this.Wishlist.create({ user_id, product_id });

        return {
            user_id: wishlist.user_id,
            product_id: wishlist.product_id,
            created_at: wishlist.created_at
        };
    }

    async deleteProductInWishlist(user_id, product_id) {
        if (!user_id || !product_id)
            throw new AppError('User id or product id are required', 400);

        const exist = await this.Wishlist.findOne({
            where: { user_id, product_id }
        });

        if (!exist)
            throw new AppError("This product doesn't exist in wishlist", 404);

        await exist.destroy();

        return {
            message: 'Remove successfully',
            product_id
        };
    }

    async initMessageHandlers() {
        await this.RabbitMQ.connect();

        this.RabbitMQ.subscribe("wishlist_product_queue", (data, rk) => {
            if (rk === 'product_detail') {
                const { correlationId, products } = data;
                const resolver = this._promiseMap.get(correlationId);
                if (resolver) {
                    resolver(products);
                    this._promiseMap.delete(correlationId);
                }
            }
        });
    }

    async getWishlist(user_id) {
        if (!user_id) throw new AppError("User is required", 400);

        const wishlist = await this.Wishlist.findAll({
            where: { user_id },
            attributes: ["product_id"]
        });

        const productIds = wishlist.map(w => w.product_id);

        // Tạo correlationId unique
        const correlationId = crypto.randomUUID();

        const dataPromise = new Promise(resolve => {
            this._promiseMap.set(correlationId, resolve);
            setTimeout(() => {
                if (this._promiseMap.has(correlationId)) {
                    this._promiseMap.delete(correlationId);
                    reject(new AppError("Product service timeout", 504));
                }
            }, 5000);
        });

        await this.RabbitMQ.publish("wishlist_product", {
            products: productIds,
            correlationId
        });

        return await dataPromise;
    }

}

export default new WishlistService();