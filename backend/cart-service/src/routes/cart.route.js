// routes/cart.route.js
import { Router } from "express";
import cartController from "../controllers/cart.controller.js";

const router = Router();


router.get("/", cartController.getCart);
router.post("/", cartController.addToCart);
router.put("/update", cartController.updateQty);
router.delete("/remove/:product_id", cartController.removeItem);
router.delete("/clear", cartController.clear);

export default router;
