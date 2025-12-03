import { Router } from "express";
import authMiddlewareInstance from "../middlewares/auth.middleware.js";

import routerAuth from './auth.route.js';
import routerUser from './user.route.js';
import routerReview from "./review.routs.js";

const router = Router();

router.use('/auth', routerAuth);

router.use('/users', authMiddlewareInstance.auth.bind(authMiddlewareInstance));
router.use('/users', routerUser);

router.use('/reviews', routerReview);

export default router;