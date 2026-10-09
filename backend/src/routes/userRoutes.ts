import { Router } from "express";
import {
  getMeController,
  loginUserController,
  registerUserController,
  getUsersController,
  updateUserBlockStatusController,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

const userRoutes = Router();

// Public routes
userRoutes.post("/register", registerUserController);
userRoutes.post("/login", loginUserController);

// Authenticated user route
userRoutes.get("/me", authMiddleware, getMeController);

// Admin-only routes
userRoutes.get(
  "/",
  authMiddleware,
  authorizeRole("ADMIN"),
  getUsersController,
);

userRoutes.patch(
  "/:id/block",
  authMiddleware,
  authorizeRole("ADMIN"),
  updateUserBlockStatusController,
);

export default userRoutes;