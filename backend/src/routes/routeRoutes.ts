import { Router } from "express";
import {
  createRouteController,
  deleteRouteController,
  getRouteController,
  listRoutesController,
  searchRoutesController,
  updateRouteController,
} from "../controllers/routeController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

const routeRoutes = Router();

routeRoutes.post(
  "/",
  authMiddleware,
  authorizeRole("ADMIN"),
  createRouteController,
);
routeRoutes.get("/search", authMiddleware, searchRoutesController);
routeRoutes.get("/", authMiddleware, listRoutesController);
routeRoutes.get("/:id", authMiddleware, getRouteController);
routeRoutes.patch(
  "/:id",
  authMiddleware,
  authorizeRole("ADMIN"),
  updateRouteController,
);
routeRoutes.delete(
  "/:id",
  authMiddleware,
  authorizeRole("ADMIN"),
  deleteRouteController,
);

export default routeRoutes;