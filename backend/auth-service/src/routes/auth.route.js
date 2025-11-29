import { register, login, verifyEmail, resendVerifyCode } from "../controllers/auth.controller.js";
import { Router } from 'express';

const route = Router();

route.post('/register', register);
route.post('/login', login);
route.post('/verify', verifyEmail);
route.post('/resend-verification-code', resendVerifyCode);

export default route;