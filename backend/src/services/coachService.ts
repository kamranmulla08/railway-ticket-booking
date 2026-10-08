import {
  createCoach as createCoachRecord,
  deleteCoach as deleteCoachRecord,
  findAllCoaches,
  findCoachById,
  findCoachByTrainAndNumber,
  findMaximumAvailableSeats,
  findTrainForCoach,
  hasSeatAvailability,
  updateCoach as updateCoachRecord,
  type CoachUpdateData,
  type NewCoachData,
} from "../repositories/coachRepository.js";

export class CoachNotFoundError extends Error {
  constructor() {
    super("Coach not found");
    this.name = "CoachNotFoundError";
  }
}

export class CoachTrainNotFoundError extends Error {
  constructor() {
    super("Train not found");
    this.name = "CoachTrainNotFoundError";
  }
}

export class CoachNumberConflictError extends Error {
  constructor() {
    super("A coach with this number already exists on the train");
    this.name = "CoachNumberConflictError";
  }
}

export class CoachHasAvailabilityError extends Error {
  constructor() {
    super("This coach has seat availability records and cannot be deleted");
    this.name = "CoachHasAvailabilityError";
  }
}

export class CoachCapacityConflictError extends Error {
  constructor() {
    super("Total seats cannot be lower than existing available seats");
    this.name = "CoachCapacityConflictError";
  }
}

export async function createCoach(coachData: NewCoachData) {
  if (!(await findTrainForCoach(coachData.trainId))) {
    throw new CoachTrainNotFoundError();
  }

  const existingCoach = await findCoachByTrainAndNumber(
    coachData.trainId,
    coachData.coachNumber,
  );

  if (existingCoach) {
    throw new CoachNumberConflictError();
  }

  return createCoachRecord(coachData);
}

export async function getAllCoaches() {
  return findAllCoaches();
}

export async function updateCoach(id: number, coachData: CoachUpdateData) {
  const coach = await findCoachById(id);

  if (!coach) {
    throw new CoachNotFoundError();
  }

  const trainId = coachData.trainId ?? coach.trainId;
  const coachNumber = coachData.coachNumber ?? coach.coachNumber;

  if (coachData.trainId !== undefined && !(await findTrainForCoach(trainId))) {
    throw new CoachTrainNotFoundError();
  }

  if (trainId !== coach.trainId || coachNumber !== coach.coachNumber) {
    const existingCoach = await findCoachByTrainAndNumber(trainId, coachNumber);

    if (existingCoach && existingCoach.id !== id) {
      throw new CoachNumberConflictError();
    }
  }

  if (coachData.totalSeats !== undefined) {
    const maximumAvailableSeats = await findMaximumAvailableSeats(id);

    if (coachData.totalSeats < maximumAvailableSeats) {
      throw new CoachCapacityConflictError();
    }
  }

  return updateCoachRecord(id, coachData);
}

export async function deleteCoach(id: number) {
  const coach = await findCoachById(id);

  if (!coach) {
    throw new CoachNotFoundError();
  }

  if (await hasSeatAvailability(id)) {
    throw new CoachHasAvailabilityError();
  }

  return deleteCoachRecord(id);
}