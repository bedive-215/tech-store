import models from '../models/index.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';

class ReviewService {
    constructor() {
        this.User = models.User;
        this.Review = models.Review;
    }

    async addReview(user_id, product_id, rating, comment = '') {
        const user = await this.User.findByPk(user_id);
        if (!user) throw new AppError('User not found!', 404);

        if (rating < 1 || rating > 5) {
            throw new AppError('Rating must be between 1 and 5', 400);
        }

        const review = await this.Review.create({
            user_id,
            product_id,
            rating,
            comment
        });

        return {
            review_id: review.id,
            user_id,
            product_id,
            rating,
            comment,
            created_at: review.created_at
        };
    }

    async getReviewsByProduct(product_id, query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;

        const sort = query.sort === "oldest" ? "ASC" : "DESC";

        const { rows, count } = await this.Review.findAndCountAll({
            where: { product_id },
            include: [
                {
                    model: this.User,
                    as: "user",
                    attributes: ["full_name", "avatar"]
                }
            ],
            order: [["created_at", sort]],
            limit,
            offset
        });

        const avg = await this.Review.findOne({
            where: { product_id },
            attributes: [
                [this.Review.sequelize.fn("AVG", this.Review.sequelize.col("rating")), "average_rating"]
            ],
            raw: true
        });

        const averageRating = avg?.average_rating
            ? Number(parseFloat(avg.average_rating).toFixed(1))
            : 0;

        const reviews = rows.map(r => ({
            review_id: r.id,
            user_name: r.user.full_name,
            avatar: r.user.avatar,
            rating: r.rating,
            comment: r.comment,
            created_at: r.created_at
        }));

        return {
            reviews,
            average_rating: averageRating,
            total: count,
            page,
            limit
        };
    }

    async deleteUserReview(review_id) {
        if (!review_id) throw new AppError('Review id is required', 400);

        const review = await this.Review.findByPk(review_id);
        if (!review) throw new AppError('This review not found', 404);

        await review.destroy();

        return {
            message: 'Delete review successfully!',
            review_id
        };
    }
}

export default new ReviewService();