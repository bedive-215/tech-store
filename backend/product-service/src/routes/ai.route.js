import express from "express";
import aiController from "../controllers/ai.controller.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

// AI Generate product details - optional auth (admin can use without strict auth for demo)
router.post("/generate", optionalAuth, aiController.generate);

export default router;
