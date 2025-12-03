import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";

import routerAuth from './auth.route.js';
import routerUser from './user.route.js';
import routerReview from "./review.routs.js";
import routerWislist from "./wishlist.route.js";

const router = Router();

router.use('/auth', routerAuth);

router.use('/users', authMiddleware.auth.bind(authMiddleware));
router.use('/users', routerUser);

router.use('/reviews', routerReview);

router.use('/wishlist', authMiddleware.auth.bind(authMiddleware));
router.use('/wishlist', routerWislist);

export default router;