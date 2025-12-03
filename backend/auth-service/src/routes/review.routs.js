import { Router } from 'express';
import { addReview, getReviewsByProduct, deleteUserReview } from "../controllers/review.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.get('/product/:product_id', getReviewsByProduct);
router.post('/', authMiddleware.auth.bind(authMiddleware), addReview);
router.delete('/:id', authMiddleware.auth.bind(authMiddleware), deleteUserReview)

export default router;