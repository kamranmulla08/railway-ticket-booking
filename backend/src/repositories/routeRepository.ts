import prisma from "../utils/prisma.js";

const routeRelations = {
  train: true,
  sourceStation: true,
  destinationStation: true,
} as const;

export type NewRouteData = {
  trainId: number;
  sourceStationId: number;
  destinationStationId: number;
  departureTime: Date;
  arrivalTime: Date;
};

export type RouteUpdateData = Partial<NewRouteData>;

export async function createRoute(routeData: NewRouteData) {
  return prisma.route.create({
    data: routeData,
    include: routeRelations,
  });
}

export async function findAllRoutes() {
  return prisma.route.findMany({
    include: routeRelations,
    orderBy: { id: "asc" },
  });
}

export async function findRouteById(id: number) {
  return prisma.route.findUnique({
    where: { id },
    include: routeRelations,
  });
}

export async function findTrainReference(id: number) {
  return prisma.train.findUnique({
    where: { id },
    select: { id: true },
  });
}

export async function findStationReference(id: number) {
  return prisma.station.findUnique({
    where: { id },
    select: { id: true },
  });
}

export async function findRoutesBetweenStations(
  sourceStationId: number,
  destinationStationId: number,
) {
  return prisma.route.findMany({
    where: { sourceStationId, destinationStationId },
    include: routeRelations,
    orderBy: { departureTime: "asc" },
  });
}

export async function updateRoute(id: number, routeData: RouteUpdateData) {
  return prisma.route.update({
    where: { id },
    data: routeData,
    include: routeRelations,
  });
}

export async function deleteRoute(id: number) {
  return prisma.route.delete({ where: { id } });
}