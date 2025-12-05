import { Router } from "express";
import BrandController from "../controllers/brand.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

// Public
router.get("/", BrandController.getBrands);

// Admin only
router.post("/", authMiddleware.auth.bind(authMiddleware), authMiddleware.checkRole('admin'), upload.single('logo'), BrandController.createBrand);
router.delete("/:id", authMiddleware.auth.bind(authMiddleware), authMiddleware.checkRole('admin'), BrandController.deleteBrand);

export default router;