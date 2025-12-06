import { Router } from "express";

import routerProduct from './product.route.js';
import routerProductMedia from './productMedia.route.js';
import routerBrand from "./brand.route.js";
import routerCategory from "./category.route.js";
import routerFlashSale from "./flashSale.route.js";

const router = Router();

router.use('/products', routerProduct);
router.use('/products', routerProductMedia);
router.use('/brands', routerBrand);
router.use('/categories', routerCategory);
router.use('/flash-sales', routerFlashSale);

export default router;