import reviewService from "../services/review.service.js";

export const addReview = async (req, res, next) => {
    try {
        const { product_id, rating, comment } = req.body;
        const result = await reviewService.addReview(req.user.id, product_id, rating, comment);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

export const getReviewsByProduct = async (req, res, next) => {
    try {
        const result = await reviewService.getReviewsByProduct(req.params.product_id, req.query);
        res.json(result);
    } catch (err) {
        console.error("Get reviews error:", err);
        next(err);
    }
};

export const deleteUserReview = async (req, res, next) => {
    try {
        const review_id = req.params.id;
        const result = await reviewService.deleteUserReview(review_id);
        res.json(result);
    } catch(err) {
        next(err);
    }
};