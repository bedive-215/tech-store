import PaymentController from "../controllers/payment.controller.js";
import authMiddleware from '../middlewares/auth.middleware.js';
import { Router } from "express";

const router = Router();

router.post('/', authMiddleware.auth.bind(authMiddleware), PaymentController.createPayment);

router.get('/vnpay_return', PaymentController.paymentCallback);

export default router;