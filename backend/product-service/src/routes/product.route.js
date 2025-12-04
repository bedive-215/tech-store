import { Router } from "express";
import productController from "../controllers/product.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);

router.post("/", authMiddleware.auth.bind(authMiddleware), authMiddleware.checkRole('admin'), productController.createProduct);
router.delete("/:id", authMiddleware.auth.bind(authMiddleware), authMiddleware.checkRole('admin'), productController.deleteProduct);
router.put("/:id", authMiddleware.auth.bind(authMiddleware), authMiddleware.checkRole("admin"), productController.updateProduct);

export default router;