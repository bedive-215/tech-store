import { Router } from "express";
import { addWishlist, deleteProductById, getWishlist } from "../controllers/wishlist.controller.js";

const router = Router();

router.post('/', addWishlist);
router.delete('/:id', deleteProductById);
router.get('/', getWishlist);

export default router;