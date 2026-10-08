import { Router } from "express";
import {
	cancelBookingController,
	createBookingController,
	getBookingByPnrController,
	getBookingHistoryController,
} from "../controllers/bookingController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

const bookingRoutes = Router();

bookingRoutes.get("/history", authMiddleware, getBookingHistoryController);
bookingRoutes.post(
	"/",
	authMiddleware,
	authorizeRole("CLIENT"),
	createBookingController,
);
bookingRoutes.get("/pnr/:pnr", authMiddleware, getBookingByPnrController);
bookingRoutes.post("/:id/cancel", authMiddleware, cancelBookingController);

export default bookingRoutes;