import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  AvailabilityAlreadyExistsError,
  AvailabilityCoachNotFoundError,
  AvailabilityTrainNotFoundError,
  AvailableSeatsExceedTotalError,
  createSeatAvailability,
  getTrainSeatAvailability,
} from "../services/seatAvailabilityService.js";

const travelDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((date) => {
    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    return (
      !Number.isNaN(parsedDate.getTime()) &&
      parsedDate.toISOString().slice(0, 10) === date
    );
  }, "Use a valid date in YYYY-MM-DD format")
  .transform((date) => new Date(`${date}T00:00:00.000Z`));

const createAvailabilitySchema = z
  .object({
    coachId: z.number().int().positive(),
    travelDate: travelDateSchema,
    availableSeats: z.number().int().min(0),
  })
  .strict();

const searchAvailabilitySchema = z
  .object({
    trainId: z.coerce.number().int().positive(),
    travelDate: travelDateSchema,
  })
  .strict();

function handleAvailabilityError(
  error: unknown,
  response: Response,
  next: NextFunction,
): void {
  if (
    error instanceof AvailabilityCoachNotFoundError ||
    error instanceof AvailabilityTrainNotFoundError
  ) {
    response.status(404).json({ message: error.message });
    return;
  }

  if (error instanceof AvailabilityAlreadyExistsError) {
    response.status(409).json({ message: error.message });
    return;
  }

  if (error instanceof AvailableSeatsExceedTotalError) {
    response.status(400).json({ message: error.message });
    return;
  }

  next(error);
}

export async function createAvailabilityController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const validation = createAvailabilitySchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      message: "Invalid seat availability details",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const availability = await createSeatAvailability(validation.data);
    response.status(201).json({ availability });
  } catch (error) {
    handleAvailabilityError(error, response, next);
  }
}

export async function getTrainAvailabilityController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const validation = searchAvailabilitySchema.safeParse(request.query);

  if (!validation.success) {
    response.status(400).json({
      message: "Invalid train ID or travel date",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const availability = await getTrainSeatAvailability(
      validation.data.trainId,
      validation.data.travelDate,
    );
    response.status(200).json({ availability });
  } catch (error) {
    handleAvailabilityError(error, response, next);
  }
}