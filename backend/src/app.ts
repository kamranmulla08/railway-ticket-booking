import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import bookingRoutes from "./routes/bookingRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import coachRoutes from "./routes/coachRoutes.js";
import routeRoutes from "./routes/routeRoutes.js";
import seatAvailabilityRoutes from "./routes/seatAvailabilityRoutes.js";
import stationRoutes from "./routes/stationRoutes.js";
import trainRoutes from "./routes/trainRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.get("/api/health", (_request, response) => {
  response.json({ message: "Railway API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/coaches", coachRoutes);
app.use("/api/stations", stationRoutes);
app.use("/api/trains", trainRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/seat-availability", seatAvailabilityRoutes);
app.use(errorHandler);

export default app;