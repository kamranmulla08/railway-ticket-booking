import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  CoachCapacityConflictError,
  CoachHasAvailabilityError,
  CoachNotFoundError,
  CoachNumberConflictError,
  CoachTrainNotFoundError,
  createCoach,
  deleteCoach,
  getAllCoaches,
  updateCoach,
} from "../services/coachService.js";

const coachSchema = z
  .object({
    trainId: z.number().int().positive(),
    coachNumber: z.string().trim().min(1),
    coachType: z.enum(["GENERAL", "SLEEPER", "AC", "CHAIR_CAR"]),
    totalSeats: z.number().int().positive(),
    fare: z.number().positive(),
  })
  .strict();

const coachUpdateSchema = coachSchema
  .partial()
  .refine((coach) => Object.keys(coach).length > 0);

const coachIdSchema = z.coerce.number().int().positive();

function handleCoachError(
  error: unknown,
  response: Response,
  next: NextFunction,
): void {
  if (error instanceof CoachNotFoundError || error instanceof CoachTrainNotFoundError) {
    response.status(404).json({ message: error.message });
    return;
  }

  if (
    error instanceof CoachNumberConflictError ||
    error instanceof CoachHasAvailabilityError ||
    error instanceof CoachCapacityConflictError
  ) {
    response.status(409).json({ message: error.message });
    return;
  }

  next(error);
}

export async function createCoachController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const validation = coachSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      message: "Invalid coach details",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const coach = await createCoach(validation.data);
    response.status(201).json({ coach });
  } catch (error) {
    handleCoachError(error, response, next);
  }
}

export async function listCoachesController(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const coaches = await getAllCoaches();
    response.status(200).json({ coaches });
  } catch (error) {
    next(error);
  }
}

export async function updateCoachController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const idValidation = coachIdSchema.safeParse(request.params.id);
  const validation = coachUpdateSchema.safeParse(request.body);

  if (!idValidation.success || !validation.success) {
    response.status(400).json({ message: "Invalid coach details" });
    return;
  }

  try {
    const coach = await updateCoach(idValidation.data, validation.data);
    response.status(200).json({ coach });
  } catch (error) {
    handleCoachError(error, response, next);
  }
}

export async function deleteCoachController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const idValidation = coachIdSchema.safeParse(request.params.id);

  if (!idValidation.success) {
    response.status(400).json({ message: "Invalid coach ID" });
    return;
  }

  try {
    await deleteCoach(idValidation.data);
    response.status(204).end();
  } catch (error) {
    handleCoachError(error, response, next);
  }
}