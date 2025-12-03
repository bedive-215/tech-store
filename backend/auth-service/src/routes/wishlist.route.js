import { Router } from "express";
import { addWishlist, deleteProductById } from "../controllers/wishlist.controller.js";

const router = Router();

router.post('/', addWishlist);
router.delete('/:id', deleteProductById);

export default router;