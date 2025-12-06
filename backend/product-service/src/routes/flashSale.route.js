import { Router } from "express";
import FlashSaleController from "../controllers/flashSale.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post('/', authMiddleware.auth.bind(authMiddleware), authMiddleware.checkRole('admin'), FlashSaleController.createFlashSale);
router.get('/', FlashSaleController.getActiveFlashSales);
router.get('/:id', FlashSaleController.getFlashSaleDetail);
router.post('/:id/items', authMiddleware.auth.bind(authMiddleware), authMiddleware.checkRole('admin'), FlashSaleController.addItem);
router.delete('/items/:item_id', authMiddleware.auth.bind(authMiddleware), authMiddleware.checkRole('admin'), FlashSaleController.removeItem);

export default router;