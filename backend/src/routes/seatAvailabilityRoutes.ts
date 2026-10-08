import { Router } from "express";
import {
  createAvailabilityController,
  getTrainAvailabilityController,
} from "../controllers/seatAvailabilityController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

const seatAvailabilityRoutes = Router();

seatAvailabilityRoutes.post(
  "/",
  authMiddleware,
  authorizeRole("ADMIN"),
  createAvailabilityController,
);
seatAvailabilityRoutes.get("/", authMiddleware, getTrainAvailabilityController);

export default seatAvailabilityRoutes;