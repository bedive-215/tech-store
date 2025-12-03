import { getUserById, getListOfUser, getUserInfo, updateUserInfo, deleteUser } from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import { Router } from "express";

const route = Router();

route.get('/me', getUserInfo);
route.patch('/me', upload.single('avatar'), updateUserInfo);
route.get('/:id', getUserById);
route.get('/', authMiddleware.checkRole("admin"), getListOfUser);
route.delete('/:id', authMiddleware.checkRole("admin"), deleteUser);

export default route;