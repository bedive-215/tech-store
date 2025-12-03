import { Router } from 'express';
import { addReview, getReviewsByProduct, deleteUserReview } from "../controllers/review.controller.js";
import authMiddlewareInstance from "../middlewares/auth.middleware.js";

const router = Router();

router.get('/product/:product_id', getReviewsByProduct);
router.post('/', authMiddlewareInstance.auth.bind(authMiddlewareInstance), addReview);
router.delete('/:id', authMiddlewareInstance.auth.bind(authMiddlewareInstance), deleteUserReview)

export default router;