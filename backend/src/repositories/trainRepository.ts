import prisma from "../utils/prisma.js";

export type NewTrainData = {
  trainNumber: string;
  name: string;
};

export type TrainUpdateData = Partial<NewTrainData>;

export async function createTrain(trainData: NewTrainData) {
  return prisma.train.create({ data: trainData });
}

export async function findAllTrains() {
  return prisma.train.findMany({ orderBy: { trainNumber: "asc" } });
}

export async function findTrainById(id: number) {
  return prisma.train.findUnique({ where: { id } });
}

export async function findTrainByNumber(trainNumber: string) {
  return prisma.train.findUnique({
    where: { trainNumber },
    select: { id: true },
  });
}

export async function updateTrain(id: number, trainData: TrainUpdateData) {
  return prisma.train.update({
    where: { id },
    data: trainData,
  });
}

export async function deleteTrain(id: number) {
  return prisma.train.delete({ where: { id } });
}