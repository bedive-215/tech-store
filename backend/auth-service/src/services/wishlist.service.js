import models from "../models/index.js";
import { AppError } from "../middlewares/errorHandler.middleware.js";

class WishlistService {
    constructor() {
        this.Wishlist = models.Wishlist;
        this.User = models.User;
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
}

export default new WishlistService();