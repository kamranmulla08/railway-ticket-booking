import {
  createSeatAvailability as createSeatAvailabilityRecord,
  findAvailabilityByCoachAndDate,
  findAvailabilityByTrainAndDate,
  findCoachForAvailability,
  findTrainForAvailability,
  type NewSeatAvailabilityData,
} from "../repositories/seatAvailabilityRepository.js";

export class AvailabilityCoachNotFoundError extends Error {
  constructor() {
    super("Coach not found");
    this.name = "AvailabilityCoachNotFoundError";
  }
}

export class AvailabilityTrainNotFoundError extends Error {
  constructor() {
    super("Train not found");
    this.name = "AvailabilityTrainNotFoundError";
  }
}

export class AvailabilityAlreadyExistsError extends Error {
  constructor() {
    super("Availability already exists for this coach and travel date");
    this.name = "AvailabilityAlreadyExistsError";
  }
}

export class AvailableSeatsExceedTotalError extends Error {
  constructor() {
    super("Available seats cannot exceed the coach total seats");
    this.name = "AvailableSeatsExceedTotalError";
  }
}

export async function createSeatAvailability(
  availabilityData: NewSeatAvailabilityData,
) {
  const coach = await findCoachForAvailability(availabilityData.coachId);

  if (!coach) {
    throw new AvailabilityCoachNotFoundError();
  }

  if (availabilityData.availableSeats > coach.totalSeats) {
    throw new AvailableSeatsExceedTotalError();
  }

  const existingAvailability = await findAvailabilityByCoachAndDate(
    availabilityData.coachId,
    availabilityData.travelDate,
  );

  if (existingAvailability) {
    throw new AvailabilityAlreadyExistsError();
  }

  return createSeatAvailabilityRecord(availabilityData);
}

export async function getTrainSeatAvailability(
  trainId: number,
  travelDate: Date,
) {
  if (!(await findTrainForAvailability(trainId))) {
    throw new AvailabilityTrainNotFoundError();
  }

  return findAvailabilityByTrainAndDate(trainId, travelDate);
}