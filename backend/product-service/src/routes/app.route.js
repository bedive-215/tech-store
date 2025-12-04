import { Router } from "express";

import routerProduct from './product.route.js';
import routerProductMedia from './productMedia.route.js';

const router = Router();

router.use('/products', routerProduct);
router.use('/products', routerProductMedia);

export default router;