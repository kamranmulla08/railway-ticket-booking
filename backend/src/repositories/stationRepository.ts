import prisma from "../utils/prisma.js";

export type NewStationData = {
  name: string;
  code: string;
  city: string;
  state: string;
};

export type StationUpdateData = Partial<NewStationData>;

export async function createStation(stationData: NewStationData) {
  return prisma.station.create({ data: stationData });
}

export async function findAllStations() {
  return prisma.station.findMany({ orderBy: { name: "asc" } });
}

export async function findStationById(id: number) {
  return prisma.station.findUnique({ where: { id } });
}

export async function findStationByCode(code: string) {
  return prisma.station.findUnique({
    where: { code },
    select: { id: true },
  });
}

export async function updateStation(id: number, stationData: StationUpdateData) {
  return prisma.station.update({
    where: { id },
    data: stationData,
  });
}

export async function deleteStation(id: number) {
  return prisma.station.delete({ where: { id } });
}