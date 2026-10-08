import {
  createStation as createStationRecord,
  deleteStation as deleteStationRecord,
  findAllStations,
  findStationByCode,
  findStationById,
  updateStation as updateStationRecord,
  type NewStationData,
  type StationUpdateData,
} from "../repositories/stationRepository.js";

export class StationNotFoundError extends Error {
  constructor() {
    super("Station not found");
    this.name = "StationNotFoundError";
  }
}

export class StationCodeConflictError extends Error {
  constructor() {
    super("A station with this code already exists");
    this.name = "StationCodeConflictError";
  }
}

export async function createStation(stationData: NewStationData) {
  const existingStation = await findStationByCode(stationData.code);

  if (existingStation) {
    throw new StationCodeConflictError();
  }

  return createStationRecord(stationData);
}

export async function getAllStations() {
  return findAllStations();
}

export async function getStationById(id: number) {
  const station = await findStationById(id);

  if (!station) {
    throw new StationNotFoundError();
  }

  return station;
}

export async function updateStation(
  id: number,
  stationData: StationUpdateData,
) {
  const station = await findStationById(id);

  if (!station) {
    throw new StationNotFoundError();
  }

  if (stationData.code && stationData.code !== station.code) {
    const existingStation = await findStationByCode(stationData.code);

    if (existingStation) {
      throw new StationCodeConflictError();
    }
  }

  return updateStationRecord(id, stationData);
}

export async function deleteStation(id: number) {
  const station = await findStationById(id);

  if (!station) {
    throw new StationNotFoundError();
  }

  return deleteStationRecord(id);
}