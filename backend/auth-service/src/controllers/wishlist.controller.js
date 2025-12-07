import wishlistService from "../services/wishlist.service.js";

export const addWishlist = async (req, res, next) => {
    try {
        const result = await wishlistService.addWishlist(req.user.id, req.body.product_id);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

export const deleteProductById = async (req, res, next) => {
    try {
        const result = await wishlistService.deleteProductInWishlist(req.user.id, req.params.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const getWishlist = async (req, res, next) => {
    try{
        const result = await wishlistService.getWishlist(req.user.id);
        res.json(result);
    } catch (err) {
        console.log(err);
        next(err);
    }
};