import { Router } from "express";
import {
  createTrainController,
  deleteTrainController,
  getTrainController,
  listTrainsController,
  updateTrainController,
} from "../controllers/trainController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

const trainRoutes = Router();

trainRoutes.post(
  "/",
  authMiddleware,
  authorizeRole("ADMIN"),
  createTrainController,
);
trainRoutes.get("/", authMiddleware, listTrainsController);
trainRoutes.get("/:id", authMiddleware, getTrainController);
trainRoutes.patch(
  "/:id",
  authMiddleware,
  authorizeRole("ADMIN"),
  updateTrainController,
);
trainRoutes.delete(
  "/:id",
  authMiddleware,
  authorizeRole("ADMIN"),
  deleteTrainController,
);

export default trainRoutes;