import { Router } from "express";
import CategoryController from "../controllers/category.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

// Public
router.get("/", CategoryController.getCategories);

// Admin only
router.post(
    "/", 
    authMiddleware.auth.bind(authMiddleware),
    authMiddleware.checkRole("admin"),
    CategoryController.createCategory
);

router.delete(
    "/:id",
    authMiddleware.auth.bind(authMiddleware),
    authMiddleware.checkRole("admin"),
    CategoryController.deleteCategory
);

export default router;