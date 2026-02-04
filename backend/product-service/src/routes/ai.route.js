import express from "express";
import aiController from "../controllers/ai.controller.js";

const router = express.Router();

// AI Generate product details - no auth needed for demo
router.post("/generate", aiController.generate);

export default router;
