import models from "../models/index.js";
import RabbitMQ from "../configs/rabbitmq.config.js";
import { AppError } from "../middlewares/errorHandler.middleware.js";

class CartService {
    constructor() {
        this.Cart = models.Cart;
        this.CartItem = models.CartItem;
        this.RabbitMQ = RabbitMQ;
    }

    async getOrCreateCart(userId) {
        let cart = await this.Cart.findOne({ where: { user_id: userId } });
        if (!cart) {
            cart = await this.Cart.create({ user_id: userId });
        }
        return cart;
    }

    async getCart(userId) {
        const cart = await this.getOrCreateCart(userId);

        const cartItems = await this.CartItem.findAll({
            where: { cart_id: cart.id },
            attributes: ['id', 'product_id', 'product_name', 'price', 'stock', 'quantity', 'image_url'],
            order: [['created_at', 'ASC']]
        });
        return cartItems;
    }


    async addItem(userId, productId, quantity = 1, product_name, image_url, stock, price) {
        const cart = await this.getOrCreateCart(userId);

        let cartItem = await this.CartItem.findOne({
            where: { cart_id: cart.id, product_id: productId },
        });

        if (cartItem) {
            cartItem.quantity += quantity;
            await cartItem.save();
        } else {
            cartItem = await this.CartItem.create({
                cart_id: cart.id,
                product_id: productId,
                quantity,
                product_name,
                image_url,
                stock,
                price
            });
        }
        return cartItem;
    }

    async updateQuantity(userId, productId, quantity) {
        const cart = await this.getOrCreateCart(userId);

        const cartItem = await this.CartItem.findOne({
            where: { cart_id: cart.id, product_id: productId },
        });

        if (!cartItem) throw new AppError("Item not found in cart", 400);

        cartItem.quantity = quantity;
        await cartItem.save();

        return cartItem;
    }

    async clearCart(userId) {
        const cart = await this.getOrCreateCart(userId);

        await this.CartItem.destroy({ where: { cart_id: cart.id } });

        return true;
    }

    async removeItem(product_id, user_id) {
        const cart = await this.getOrCreateCart(user_id);

        const cartItem = await this.CartItem.findOne({
            where: { cart_id: cart.id, product_id: product_id },
        });

        if (!cartItem) throw new AppError('Item not found in cart', 400);

        await cartItem.destroy();

        return;
    }

    async initMessageHandlers() {
        await this.RabbitMQ.subscribe('product_queue', async (data, rk) => {
            try {
                switch (rk) {

                    case 'change_stock': {
                        const { product_id, stock } = data;

                        if (!product_id || typeof stock !== "number") {
                            console.warn('[change_stock] Invalid data', data);
                            return;
                        }

                        if (stock <= 0) {
                            await this.CartItem.destroy({ where: { product_id } });
                            console.log(`[change_stock] Removed cart items of product ${product_id}`);
                            return;
                        }

                        const [updatedCount] = await this.CartItem.update(
                            { stock },
                            { where: { product_id } }
                        );

                        console.log(`[change_stock] Updated stock for ${updatedCount} cart items of product ${product_id}`);
                        break;
                    }

                    case 'change_price': {
                        const { product_id, price } = data;

                        if (!product_id || typeof price !== "number") {
                            console.warn('[change_price] Invalid data', data);
                            return;
                        }

                        const [updatedCount] = await this.CartItem.update(
                            { price },
                            { where: { product_id } }
                        );

                        console.log(`[change_price] Updated price for ${updatedCount} cart items of product ${product_id}`);
                        break;
                    }

                    case 'delete_product': {
                        const { product_id } = data;

                        if (!product_id) {
                            console.warn('[delete_product] Invalid data', data);
                            return;
                        }

                        const deletedCount = await this.CartItem.destroy({
                            where: { product_id }
                        });

                        console.log(`[delete_product] Deleted ${deletedCount} cart items of product ${product_id}`);
                        break;
                    }

                    case 'change_name': {
                        const { product_id, name } = data;

                        if (!product_id || !name) {
                            console.warn('[change_name] Invalid data', data);
                            return;
                        }

                        const [updatedCount] = await this.CartItem.update(
                            { product_name: name },
                            { where: { product_id } }
                        );

                        console.log(`[change_name] Updated name for ${updatedCount} cart items of product ${product_id}`);
                        break;
                    }

                    default:
                        console.warn(`[RabbitMQ] Unknown routing key: ${rk}`, data);
                }
            } catch (err) {
                console.error(`[RabbitMQ] Error handling routing key ${rk}`, err);
            }
        });
    }
}

export default new CartService();
