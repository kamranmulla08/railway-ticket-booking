import { Router } from "express";
import {
	getMeController,
	loginUserController,
	registerUserController,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const userRoutes = Router();

userRoutes.post("/register", registerUserController);
userRoutes.post("/login", loginUserController);
userRoutes.get("/me", authMiddleware, getMeController);

export default userRoutes;