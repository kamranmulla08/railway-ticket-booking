import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  createRoute,
  deleteRoute,
  getAllRoutes,
  getRouteById,
  RouteNotFoundError,
  RouteReferenceNotFoundError,
  RouteStationsMustDifferError,
  searchRoutes,
  updateRoute,
} from "../services/routeService.js";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Use HH:mm or HH:mm:ss")
  .transform((time) => {
    const timeWithSeconds = time.length === 5 ? `${time}:00` : time;
    return new Date(`1970-01-01T${timeWithSeconds}.000Z`);
  });

const routeFieldsSchema = z
  .object({
    trainId: z.coerce.number().int().positive(),
    sourceStationId: z.coerce.number().int().positive(),
    destinationStationId: z.coerce.number().int().positive(),
    departureTime: timeSchema,
    arrivalTime: timeSchema,
  })
  .strict();

const routeSchema = routeFieldsSchema
  .refine((route) => route.sourceStationId !== route.destinationStationId);

const routeUpdateSchema = routeFieldsSchema
  .partial()
  .refine((route) => Object.keys(route).length > 0);

const routeIdSchema = z.coerce.number().int().positive();

const routeSearchSchema = z
  .object({
    sourceStationId: z.coerce.number().int().positive(),
    destinationStationId: z.coerce.number().int().positive(),
  })
  .strict();

function handleRouteError(
  error: unknown,
  response: Response,
  next: NextFunction,
): void {
  if (error instanceof RouteNotFoundError || error instanceof RouteReferenceNotFoundError) {
    response.status(404).json({ message: error.message });
    return;
  }

  if (error instanceof RouteStationsMustDifferError) {
    response.status(400).json({ message: error.message });
    return;
  }

  next(error);
}

export async function createRouteController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const validation = routeSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      message: "Invalid route details",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const route = await createRoute(validation.data);
    response.status(201).json({ route });
  } catch (error) {
    handleRouteError(error, response, next);
  }
}

export async function listRoutesController(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const routes = await getAllRoutes();
    response.status(200).json({ routes });
  } catch (error) {
    next(error);
  }
}

export async function getRouteController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const idValidation = routeIdSchema.safeParse(request.params.id);

  if (!idValidation.success) {
    response.status(400).json({ message: "Invalid route ID" });
    return;
  }

  try {
    const route = await getRouteById(idValidation.data);
    response.status(200).json({ route });
  } catch (error) {
    handleRouteError(error, response, next);
  }
}

export async function searchRoutesController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const validation = routeSearchSchema.safeParse(request.query);

  if (!validation.success) {
    response.status(400).json({
      message: "Invalid station IDs",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const routes = await searchRoutes(
      validation.data.sourceStationId,
      validation.data.destinationStationId,
    );
    response.status(200).json({ routes });
  } catch (error) {
    handleRouteError(error, response, next);
  }
}

export async function updateRouteController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const idValidation = routeIdSchema.safeParse(request.params.id);
  const validation = routeUpdateSchema.safeParse(request.body);

  if (!idValidation.success || !validation.success) {
    response.status(400).json({ message: "Invalid route details" });
    return;
  }

  try {
    const route = await updateRoute(idValidation.data, validation.data);
    response.status(200).json({ route });
  } catch (error) {
    handleRouteError(error, response, next);
  }
}

export async function deleteRouteController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const idValidation = routeIdSchema.safeParse(request.params.id);

  if (!idValidation.success) {
    response.status(400).json({ message: "Invalid route ID" });
    return;
  }

  try {
    await deleteRoute(idValidation.data);
    response.status(204).end();
  } catch (error) {
    handleRouteError(error, response, next);
  }
}