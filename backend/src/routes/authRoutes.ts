import { Router } from "express";
import {
	loginUserController,
	registerUserController,
} from "../controllers/userController.js";

const authRoutes = Router();

authRoutes.post("/register", registerUserController);
authRoutes.post("/login", loginUserController);

export default authRoutes;