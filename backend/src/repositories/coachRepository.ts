import prisma from "../utils/prisma.js";

export type NewCoachData = {
  trainId: number;
  coachNumber: string;
  coachType: "GENERAL" | "SLEEPER" | "AC" | "CHAIR_CAR";
  totalSeats: number;
  fare: number;
};

export type CoachUpdateData = Partial<NewCoachData>;

export async function createCoach(coachData: NewCoachData) {
  return prisma.coach.create({ data: coachData });
}

export async function findAllCoaches() {
  return prisma.coach.findMany({ orderBy: [{ trainId: "asc" }, { coachNumber: "asc" }] });
}

export async function findCoachById(id: number) {
  return prisma.coach.findUnique({ where: { id } });
}

export async function findTrainForCoach(trainId: number) {
  return prisma.train.findUnique({
    where: { id: trainId },
    select: { id: true },
  });
}

export async function findCoachByTrainAndNumber(
  trainId: number,
  coachNumber: string,
) {
  return prisma.coach.findFirst({
    where: { trainId, coachNumber },
    select: { id: true },
  });
}

export async function hasSeatAvailability(coachId: number) {
  const availability = await prisma.seatAvailability.findFirst({
    where: { coachId },
    select: { id: true },
  });

  return availability !== null;
}

export async function findMaximumAvailableSeats(coachId: number) {
  const result = await prisma.seatAvailability.aggregate({
    where: { coachId },
    _max: { availableSeats: true },
  });

  return result._max.availableSeats ?? 0;
}

export async function updateCoach(id: number, coachData: CoachUpdateData) {
  return prisma.coach.update({ where: { id }, data: coachData });
}

export async function deleteCoach(id: number) {
  return prisma.coach.delete({ where: { id } });
}