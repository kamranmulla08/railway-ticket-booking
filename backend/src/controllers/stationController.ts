import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  createStation,
  deleteStation,
  getAllStations,
  getStationById,
  StationCodeConflictError,
  StationNotFoundError,
  updateStation,
} from "../services/stationService.js";

const stationSchema = z
  .object({
    name: z.string().trim().min(1),
    code: z.string().trim().min(1).transform((code) => code.toUpperCase()),
    city: z.string().trim().min(1),
    state: z.string().trim().min(1),
  })
  .strict();

const stationUpdateSchema = stationSchema
  .partial()
  .refine((station) => Object.keys(station).length > 0);

const stationIdSchema = z.coerce.number().int().positive();

function handleStationError(
  error: unknown,
  response: Response,
  next: NextFunction,
): void {
  if (error instanceof StationNotFoundError) {
    response.status(404).json({ message: error.message });
    return;
  }

  if (error instanceof StationCodeConflictError) {
    response.status(409).json({ message: error.message });
    return;
  }

  next(error);
}

export async function createStationController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const validation = stationSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      message: "Invalid station details",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const station = await createStation(validation.data);
    response.status(201).json({ station });
  } catch (error) {
    handleStationError(error, response, next);
  }
}

export async function listStationsController(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const stations = await getAllStations();
    response.status(200).json({ stations });
  } catch (error) {
    next(error);
  }
}

export async function getStationController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const idValidation = stationIdSchema.safeParse(request.params.id);

  if (!idValidation.success) {
    response.status(400).json({ message: "Invalid station ID" });
    return;
  }

  try {
    const station = await getStationById(idValidation.data);
    response.status(200).json({ station });
  } catch (error) {
    handleStationError(error, response, next);
  }
}

export async function updateStationController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const idValidation = stationIdSchema.safeParse(request.params.id);
  const validation = stationUpdateSchema.safeParse(request.body);

  if (!idValidation.success || !validation.success) {
    response.status(400).json({ message: "Invalid station details" });
    return;
  }

  try {
    const station = await updateStation(idValidation.data, validation.data);
    response.status(200).json({ station });
  } catch (error) {
    handleStationError(error, response, next);
  }
}

export async function deleteStationController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const idValidation = stationIdSchema.safeParse(request.params.id);

  if (!idValidation.success) {
    response.status(400).json({ message: "Invalid station ID" });
    return;
  }

  try {
    await deleteStation(idValidation.data);
    response.status(204).end();
  } catch (error) {
    handleStationError(error, response, next);
  }
}