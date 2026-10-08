import { Router } from "express";
import {
  createCoachController,
  deleteCoachController,
  listCoachesController,
  updateCoachController,
} from "../controllers/coachController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

const coachRoutes = Router();

coachRoutes.post(
  "/",
  authMiddleware,
  authorizeRole("ADMIN"),
  createCoachController,
);
coachRoutes.get(
  "/",
  authMiddleware,
  authorizeRole("ADMIN"),
  listCoachesController,
);
coachRoutes.patch(
  "/:id",
  authMiddleware,
  authorizeRole("ADMIN"),
  updateCoachController,
);
coachRoutes.delete(
  "/:id",
  authMiddleware,
  authorizeRole("ADMIN"),
  deleteCoachController,
);

export default coachRoutes;