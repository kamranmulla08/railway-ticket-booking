import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  BookingWorkflowError,
  cancelBooking,
  createBooking,
  getBookingByPnr,
  getBookingHistory,
} from "../services/bookingService.js";

const journeyDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((date) => {
    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === date;
  }, "Use a valid journey date in YYYY-MM-DD format")
  .transform((date) => new Date(`${date}T00:00:00.000Z`));

const createBookingSchema = z
  .object({
    trainId: z.number().int().positive(),
    coachId: z.number().int().positive(),
    journeyDate: journeyDateSchema,
    passengers: z
      .array(
        z.object({
          name: z.string().trim().min(1),
          age: z.number().int().min(1).max(120),
          gender: z.enum(["MALE", "FEMALE", "OTHER"]),
        }).strict(),
      )
      .min(1)
      .max(12),
  })
  .strict();

const bookingIdSchema = z.coerce.number().int().positive();
const pnrSchema = z.string().trim().regex(/^RY[A-F0-9]{12}$/i);

function handleBookingError(
  error: unknown,
  response: Response,
  next: NextFunction,
): void {
  if (!(error instanceof BookingWorkflowError)) {
    next(error);
    return;
  }

  if (error.code === "BOOKING_NOT_FOUND" || error.code === "PNR_NOT_FOUND" ||
      error.code === "COACH_NOT_FOUND") {
    response.status(404).json({ message: error.message });
    return;
  }

  if (error.code === "BOOKING_NOT_OWNED") {
    response.status(404).json({ message: error.message });
    return;
  }

  if (error.code === "TRAIN_COACH_MISMATCH") {
    response.status(400).json({ message: error.message });
    return;
  }

  if (error.code === "AVAILABILITY_NOT_FOUND" || error.code === "FARE_NOT_CONFIGURED") {
    response.status(409).json({ message: error.message });
    return;
  }

  response.status(409).json({ message: error.message });
}

export async function getBookingHistoryController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  if (!request.user) {
    response.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const bookings = await getBookingHistory(request.user.userId);
    response.status(200).json({ bookings });
  } catch (error) {
    next(error);
  }
}

export async function createBookingController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  if (!request.user) {
    response.status(401).json({ message: "Authentication required" });
    return;
  }

  const validation = createBookingSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      message: "Invalid booking details",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const booking = await createBooking(request.user.userId, validation.data);
    response.status(201).json({ booking });
  } catch (error) {
    handleBookingError(error, response, next);
  }
}

export async function getBookingByPnrController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  if (!request.user) {
    response.status(401).json({ message: "Authentication required" });
    return;
  }

  const validation = pnrSchema.safeParse(request.params.pnr);

  if (!validation.success) {
    response.status(400).json({ message: "Invalid PNR format" });
    return;
  }

  try {
    const booking = await getBookingByPnr(
      validation.data,
      request.user.userId,
      request.user.role,
    );
    response.status(200).json({ booking });
  } catch (error) {
    handleBookingError(error, response, next);
  }
}

export async function cancelBookingController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  if (!request.user) {
    response.status(401).json({ message: "Authentication required" });
    return;
  }

  const validation = bookingIdSchema.safeParse(request.params.id);

  if (!validation.success) {
    response.status(400).json({ message: "Invalid booking ID" });
    return;
  }

  try {
    const booking = await cancelBooking(
      validation.data,
      request.user.userId,
      request.user.role,
    );
    response.status(200).json({ booking });
  } catch (error) {
    handleBookingError(error, response, next);
  }
}