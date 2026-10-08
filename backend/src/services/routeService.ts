import {
  createRoute as createRouteRecord,
  deleteRoute as deleteRouteRecord,
  findAllRoutes,
  findRouteById,
  findRoutesBetweenStations,
  findStationReference,
  findTrainReference,
  updateRoute as updateRouteRecord,
  type NewRouteData,
  type RouteUpdateData,
} from "../repositories/routeRepository.js";

export class RouteNotFoundError extends Error {
  constructor() {
    super("Route not found");
    this.name = "RouteNotFoundError";
  }
}

export class RouteReferenceNotFoundError extends Error {
  constructor(reference: string) {
    super(`${reference} not found`);
    this.name = "RouteReferenceNotFoundError";
  }
}

export class RouteStationsMustDifferError extends Error {
  constructor() {
    super("Source and destination stations must be different");
    this.name = "RouteStationsMustDifferError";
  }
}

async function validateRouteReferences(routeData: NewRouteData) {
  if (!(await findTrainReference(routeData.trainId))) {
    throw new RouteReferenceNotFoundError("Train");
  }

  if (!(await findStationReference(routeData.sourceStationId))) {
    throw new RouteReferenceNotFoundError("Source station");
  }

  if (!(await findStationReference(routeData.destinationStationId))) {
    throw new RouteReferenceNotFoundError("Destination station");
  }

  if (routeData.sourceStationId === routeData.destinationStationId) {
    throw new RouteStationsMustDifferError();
  }
}

export async function createRoute(routeData: NewRouteData) {
  await validateRouteReferences(routeData);
  return createRouteRecord(routeData);
}

export async function getAllRoutes() {
  return findAllRoutes();
}

export async function getRouteById(id: number) {
  const route = await findRouteById(id);

  if (!route) {
    throw new RouteNotFoundError();
  }

  return route;
}

export async function searchRoutes(
  sourceStationId: number,
  destinationStationId: number,
) {
  if (sourceStationId === destinationStationId) {
    throw new RouteStationsMustDifferError();
  }

  if (!(await findStationReference(sourceStationId))) {
    throw new RouteReferenceNotFoundError("Source station");
  }

  if (!(await findStationReference(destinationStationId))) {
    throw new RouteReferenceNotFoundError("Destination station");
  }

  return findRoutesBetweenStations(sourceStationId, destinationStationId);
}

export async function updateRoute(id: number, routeData: RouteUpdateData) {
  const existingRoute = await findRouteById(id);

  if (!existingRoute) {
    throw new RouteNotFoundError();
  }

  const updatedRouteData: NewRouteData = {
    trainId: routeData.trainId ?? existingRoute.trainId,
    sourceStationId: routeData.sourceStationId ?? existingRoute.sourceStationId,
    destinationStationId:
      routeData.destinationStationId ?? existingRoute.destinationStationId,
    departureTime: routeData.departureTime ?? existingRoute.departureTime,
    arrivalTime: routeData.arrivalTime ?? existingRoute.arrivalTime,
  };

  await validateRouteReferences(updatedRouteData);
  return updateRouteRecord(id, routeData);
}

export async function deleteRoute(id: number) {
  const route = await findRouteById(id);

  if (!route) {
    throw new RouteNotFoundError();
  }

  return deleteRouteRecord(id);
}