import {
  createTrain as createTrainRecord,
  deleteTrain as deleteTrainRecord,
  findAllTrains,
  findTrainById,
  findTrainByNumber,
  updateTrain as updateTrainRecord,
  type NewTrainData,
  type TrainUpdateData,
} from "../repositories/trainRepository.js";

export class TrainNotFoundError extends Error {
  constructor() {
    super("Train not found");
    this.name = "TrainNotFoundError";
  }
}

export class TrainNumberConflictError extends Error {
  constructor() {
    super("A train with this number already exists");
    this.name = "TrainNumberConflictError";
  }
}

export async function createTrain(trainData: NewTrainData) {
  const existingTrain = await findTrainByNumber(trainData.trainNumber);

  if (existingTrain) {
    throw new TrainNumberConflictError();
  }

  return createTrainRecord(trainData);
}

export async function getAllTrains() {
  return findAllTrains();
}

export async function getTrainById(id: number) {
  const train = await findTrainById(id);

  if (!train) {
    throw new TrainNotFoundError();
  }

  return train;
}

export async function updateTrain(id: number, trainData: TrainUpdateData) {
  const train = await findTrainById(id);

  if (!train) {
    throw new TrainNotFoundError();
  }

  if (trainData.trainNumber && trainData.trainNumber !== train.trainNumber) {
    const existingTrain = await findTrainByNumber(trainData.trainNumber);

    if (existingTrain) {
      throw new TrainNumberConflictError();
    }
  }

  return updateTrainRecord(id, trainData);
}

export async function deleteTrain(id: number) {
  const train = await findTrainById(id);

  if (!train) {
    throw new TrainNotFoundError();
  }

  return deleteTrainRecord(id);
}