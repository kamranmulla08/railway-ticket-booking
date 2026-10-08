import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  createTrain,
  deleteTrain,
  getAllTrains,
  getTrainById,
  TrainNotFoundError,
  TrainNumberConflictError,
  updateTrain,
} from "../services/trainService.js";

const trainSchema = z
  .object({
    trainNumber: z.string().trim().min(1),
    name: z.string().trim().min(1),
  })
  .strict();

const trainUpdateSchema = trainSchema
  .partial()
  .refine((train) => Object.keys(train).length > 0);

const trainIdSchema = z.coerce.number().int().positive();

function handleTrainError(
  error: unknown,
  response: Response,
  next: NextFunction,
): void {
  if (error instanceof TrainNotFoundError) {
    response.status(404).json({ message: error.message });
    return;
  }

  if (error instanceof TrainNumberConflictError) {
    response.status(409).json({ message: error.message });
    return;
  }

  next(error);
}

export async function createTrainController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const validation = trainSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      message: "Invalid train details",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const train = await createTrain(validation.data);
    response.status(201).json({ train });
  } catch (error) {
    handleTrainError(error, response, next);
  }
}

export async function listTrainsController(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const trains = await getAllTrains();
    response.status(200).json({ trains });
  } catch (error) {
    next(error);
  }
}

export async function getTrainController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const idValidation = trainIdSchema.safeParse(request.params.id);

  if (!idValidation.success) {
    response.status(400).json({ message: "Invalid train ID" });
    return;
  }

  try {
    const train = await getTrainById(idValidation.data);
    response.status(200).json({ train });
  } catch (error) {
    handleTrainError(error, response, next);
  }
}

export async function updateTrainController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const idValidation = trainIdSchema.safeParse(request.params.id);
  const validation = trainUpdateSchema.safeParse(request.body);

  if (!idValidation.success || !validation.success) {
    response.status(400).json({ message: "Invalid train details" });
    return;
  }

  try {
    const train = await updateTrain(idValidation.data, validation.data);
    response.status(200).json({ train });
  } catch (error) {
    handleTrainError(error, response, next);
  }
}

export async function deleteTrainController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const idValidation = trainIdSchema.safeParse(request.params.id);

  if (!idValidation.success) {
    response.status(400).json({ message: "Invalid train ID" });
    return;
  }

  try {
    await deleteTrain(idValidation.data);
    response.status(204).end();
  } catch (error) {
    handleTrainError(error, response, next);
  }
}