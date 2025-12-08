import { Router } from "express";
import cartRouter from './cart.route.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

router.use('/carts', authMiddleware.auth.bind(authMiddleware));
router.use('/carts', cartRouter);

export default router;