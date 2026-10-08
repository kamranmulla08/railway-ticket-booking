import prisma from "../utils/prisma.js";

export type BookingPassengerData = {
  name: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER";
};

export type CreateBookingData = {
  userId: number;
  trainId: number;
  coachId: number;
  journeyDate: Date;
  pnr: string;
  passengers: BookingPassengerData[];
};

export type BookingRepositoryErrorCode =
  | "COACH_NOT_FOUND"
  | "TRAIN_COACH_MISMATCH"
  | "FARE_NOT_CONFIGURED"
  | "AVAILABILITY_NOT_FOUND"
  | "NOT_ENOUGH_SEATS"
  | "BOOKING_NOT_FOUND"
  | "BOOKING_NOT_OWNED"
  | "BOOKING_ALREADY_CANCELLED"
  | "BOOKING_NOT_CONFIRMED"
  | "SEAT_RESTORE_LIMIT"
  | "PNR_NOT_FOUND";

export class BookingRepositoryError extends Error {
  constructor(readonly code: BookingRepositoryErrorCode) {
    super(code);
    this.name = "BookingRepositoryError";
  }
}

const bookingDetails = {
  train: { select: { id: true, trainNumber: true, name: true } },
  coach: {
    select: {
      id: true,
      coachNumber: true,
      coachType: true,
      fare: true,
    },
  },
  passengers: {
    select: {
      id: true,
      name: true,
      age: true,
      gender: true,
      seatNumber: true,
    },
  },
} as const;

export async function findBookingsByUserId(userId: number) {
  return prisma.booking.findMany({
    where: { userId },
    select: {
      id: true,
      pnr: true,
      journeyDate: true,
      status: true,
      totalAmount: true,
      coach: {
        select: {
          id: true,
          coachNumber: true,
          coachType: true,
        },
      },
      train: {
        select: {
          id: true,
          trainNumber: true,
          name: true,
        },
      },
      passengers: {
        select: {
          id: true,
          name: true,
          age: true,
          gender: true,
          seatNumber: true,
        },
      },
    },
    orderBy: { bookingDate: "desc" },
  });
}

export async function createBookingTransaction(data: CreateBookingData) {
  return prisma.$transaction(async (transaction) => {
    const coach = await transaction.coach.findUnique({
      where: { id: data.coachId },
      select: { id: true, trainId: true, coachNumber: true, totalSeats: true, fare: true },
    });

    if (!coach) throw new BookingRepositoryError("COACH_NOT_FOUND");
    if (coach.trainId !== data.trainId) {
      throw new BookingRepositoryError("TRAIN_COACH_MISMATCH");
    }
    if (coach.fare === null) {
      throw new BookingRepositoryError("FARE_NOT_CONFIGURED");
    }

    const availability = await transaction.seatAvailability.findUnique({
      where: {
        coachId_travelDate: {
          coachId: data.coachId,
          travelDate: data.journeyDate,
        },
      },
      select: { id: true },
    });

    if (!availability) {
      throw new BookingRepositoryError("AVAILABILITY_NOT_FOUND");
    }

    const seatUpdate = await transaction.seatAvailability.updateMany({
      where: {
        id: availability.id,
        availableSeats: { gte: data.passengers.length },
      },
      data: { availableSeats: { decrement: data.passengers.length } },
    });

    if (seatUpdate.count !== 1) {
      throw new BookingRepositoryError("NOT_ENOUGH_SEATS");
    }

    const occupiedSeats = await transaction.passenger.findMany({
      where: {
        booking: {
          coachId: data.coachId,
          journeyDate: data.journeyDate,
          status: { not: "CANCELLED" },
        },
      },
      select: { seatNumber: true },
    });
    const usedSeatNumbers = new Set(occupiedSeats.map((passenger) => passenger.seatNumber));
    let nextSeatNumber = 1;

    const passengers = data.passengers.map((passenger) => {
      while (
        nextSeatNumber <= coach.totalSeats &&
        usedSeatNumbers.has(String(nextSeatNumber))
      ) {
        nextSeatNumber += 1;
      }

      if (nextSeatNumber > coach.totalSeats) {
        throw new BookingRepositoryError("NOT_ENOUGH_SEATS");
      }

      const seatNumber = String(nextSeatNumber);
      usedSeatNumbers.add(seatNumber);
      nextSeatNumber += 1;

      return { ...passenger, seatNumber };
    });

    const totalAmount = coach.fare.mul(data.passengers.length);

    return transaction.booking.create({
      data: {
        userId: data.userId,
        trainId: data.trainId,
        coachId: data.coachId,
        pnr: data.pnr,
        journeyDate: data.journeyDate,
        status: "CONFIRMED",
        totalAmount,
        passengers: { create: passengers },
      },
      include: bookingDetails,
    });
  });
}

export async function findBookingByPnr(pnr: string) {
  return prisma.booking.findUnique({
    where: { pnr },
    select: {
      id: true,
      userId: true,
      pnr: true,
      journeyDate: true,
      status: true,
      totalAmount: true,
      train: {
        select: { id: true, trainNumber: true, name: true },
      },
      coach: {
        select: { id: true, coachNumber: true, coachType: true },
      },
      passengers: {
        select: {
          id: true,
          name: true,
          age: true,
          gender: true,
          seatNumber: true,
        },
      },
    },
  });
}

export async function cancelBookingTransaction(
  bookingId: number,
  userId: number,
  role: "ADMIN" | "CLIENT",
) {
  return prisma.$transaction(async (transaction) => {
    const booking = await transaction.booking.findUnique({
      where: { id: bookingId },
      include: {
        passengers: { select: { id: true } },
        coach: { select: { totalSeats: true } },
      },
    });

    if (!booking) throw new BookingRepositoryError("BOOKING_NOT_FOUND");
    if (role === "CLIENT" && booking.userId !== userId) {
      throw new BookingRepositoryError("BOOKING_NOT_OWNED");
    }
    if (booking.status === "CANCELLED") {
      throw new BookingRepositoryError("BOOKING_ALREADY_CANCELLED");
    }
    if (booking.status !== "CONFIRMED") {
      throw new BookingRepositoryError("BOOKING_NOT_CONFIRMED");
    }

    const passengerCount = booking.passengers.length;

    if (passengerCount > 0) {
      const seatUpdate = await transaction.seatAvailability.updateMany({
        where: {
          coachId: booking.coachId,
          travelDate: booking.journeyDate,
          availableSeats: { lte: booking.coach.totalSeats - passengerCount },
        },
        data: { availableSeats: { increment: passengerCount } },
      });

      if (seatUpdate.count !== 1) {
        throw new BookingRepositoryError("SEAT_RESTORE_LIMIT");
      }
    }

    const bookingUpdate = await transaction.booking.updateMany({
      where: { id: booking.id, status: "CONFIRMED" },
      data: { status: "CANCELLED" },
    });

    if (bookingUpdate.count !== 1) {
      throw new BookingRepositoryError("BOOKING_ALREADY_CANCELLED");
    }

    return transaction.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: bookingDetails,
    });
  });
}