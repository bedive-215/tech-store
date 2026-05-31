import { Router } from "express";
import productMediaController from "../controllers/productMedia.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router.post(
    "/:product_id/media",
    authMiddleware.auth.bind(authMiddleware),
    authMiddleware.checkRole("admin"),
    upload.array("files", 20),      // field name = "files"
    productMediaController.uploadProductMedia
);

router.post(
    "/:product_id/media/primary",
    authMiddleware.auth.bind(authMiddleware),
    authMiddleware.checkRole("admin"),
    upload.single("file"),          // field name = "file"
    productMediaController.setPrimaryImage
);

router.delete(
    "/:product_id/media",
    authMiddleware.auth.bind(authMiddleware),
    authMiddleware.checkRole("admin"),
    productMediaController.deleteMedia
);

// Upload image from external URL (for AI-generated images)
router.post(
    "/:product_id/media/from-url",
    authMiddleware.auth.bind(authMiddleware),
    authMiddleware.checkRole("admin"),
    productMediaController.uploadFromUrl
);

export default router;
