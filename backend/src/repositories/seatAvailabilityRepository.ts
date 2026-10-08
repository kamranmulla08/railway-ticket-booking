import prisma from "../utils/prisma.js";

export type NewSeatAvailabilityData = {
  coachId: number;
  travelDate: Date;
  availableSeats: number;
};

export async function findCoachForAvailability(coachId: number) {
  return prisma.coach.findUnique({
    where: { id: coachId },
    select: { id: true, totalSeats: true },
  });
}

export async function findAvailabilityByCoachAndDate(
  coachId: number,
  travelDate: Date,
) {
  return prisma.seatAvailability.findFirst({
    where: { coachId, travelDate },
    select: { id: true },
  });
}

export async function createSeatAvailability(
  availabilityData: NewSeatAvailabilityData,
) {
  return prisma.seatAvailability.create({ data: availabilityData });
}

export async function findTrainForAvailability(trainId: number) {
  return prisma.train.findUnique({
    where: { id: trainId },
    select: { id: true },
  });
}

export async function findAvailabilityByTrainAndDate(
  trainId: number,
  travelDate: Date,
) {
  return prisma.seatAvailability.findMany({
    where: {
      travelDate,
      coach: { is: { trainId } },
    },
    include: {
      coach: {
        select: {
          id: true,
          trainId: true,
          coachNumber: true,
          coachType: true,
          totalSeats: true,
          fare: true,
        },
      },
    },
  });
}