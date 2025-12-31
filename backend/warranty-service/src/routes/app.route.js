import { Router } from "express";
import WarrantyController from "../controllers/warranty.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import multer from "../middlewares/multer.middleware.js";

const router = Router();

// User tạo yêu cầu bảo hành
router.post('/', authMiddleware.auth, multer.array('files',5), WarrantyController.createWarranty);

// User xem yêu cầu của mình
router.get('/my', authMiddleware.auth, WarrantyController.getMyWarranty);

// Admin xem tất cả
router.get('/', authMiddleware.auth, authMiddleware.checkRole('admin'), WarrantyController.getAllWarranty);

// Admin cập nhật trạng thái
router.patch('/:id/status', authMiddleware.auth, authMiddleware.checkRole('admin'), WarrantyController.updateWarrantyStatus);

// Kiểm tra yêu cầu bảo hành có hợp lệ
router.post('/valid/:warranty_id', authMiddleware.auth, authMiddleware.checkRole('admin'), WarrantyController.validateWarranty);

export default router;