import { getUserById, getListOfUser, getUserInfo, updateUserInfo, deleteUser } from "../controllers/user.controller.js";
import authMiddlewareInstance from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import { Router } from "express";

const route = Router();

route.get('/me', getUserInfo);
route.patch('/me', upload.single('avatar'), updateUserInfo);
route.get('/:id', getUserById);
route.get('/', authMiddlewareInstance.checkRole("admin"), getListOfUser);
route.delete('/:id', authMiddlewareInstance.checkRole("admin"), deleteUser);

export default route;