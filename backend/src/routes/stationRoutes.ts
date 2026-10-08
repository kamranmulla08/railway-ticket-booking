import { Router } from "express";
import {
  createStationController,
  deleteStationController,
  getStationController,
  listStationsController,
  updateStationController,
} from "../controllers/stationController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

const stationRoutes = Router();

stationRoutes.post(
  "/",
  authMiddleware,
  authorizeRole("ADMIN"),
  createStationController,
);
stationRoutes.get("/", authMiddleware, listStationsController);
stationRoutes.get("/:id", authMiddleware, getStationController);
stationRoutes.patch(
  "/:id",
  authMiddleware,
  authorizeRole("ADMIN"),
  updateStationController,
);
stationRoutes.delete(
  "/:id",
  authMiddleware,
  authorizeRole("ADMIN"),
  deleteStationController,
);

export default stationRoutes;