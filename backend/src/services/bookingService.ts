import { randomBytes } from "node:crypto";
import {
  BookingRepositoryError,
  cancelBookingTransaction,
  createBookingTransaction,
  findBookingByPnr,
  findBookingsByUserId,
  type BookingPassengerData,
  type BookingRepositoryErrorCode,
} from "../repositories/bookingRepository.js";

export type NewBookingData = {
  trainId: number;
  coachId: number;
  journeyDate: Date;
  passengers: BookingPassengerData[];
};

const bookingErrorMessages: Record<BookingRepositoryErrorCode, string> = {
  COACH_NOT_FOUND: "Coach not found",
  TRAIN_COACH_MISMATCH: "The selected coach does not belong to this train",
  FARE_NOT_CONFIGURED: "This coach does not have a fare configured yet",
  AVAILABILITY_NOT_FOUND: "No availability is configured for this coach and date",
  NOT_ENOUGH_SEATS: "Not enough seats are available",
  BOOKING_NOT_FOUND: "Booking not found",
  BOOKING_NOT_OWNED: "Booking not found",
  BOOKING_ALREADY_CANCELLED: "This booking has already been cancelled",
  BOOKING_NOT_CONFIRMED: "Only confirmed bookings can be cancelled",
  SEAT_RESTORE_LIMIT: "Seats cannot be restored without exceeding coach capacity",
  PNR_NOT_FOUND: "Invalid PNR",
};

export class BookingWorkflowError extends Error {
  constructor(readonly code: BookingRepositoryErrorCode) {
    super(bookingErrorMessages[code]);
    this.name = "BookingWorkflowError";
  }
}

function convertRepositoryError(error: unknown): never {
  if (error instanceof BookingRepositoryError) {
    throw new BookingWorkflowError(error.code);
  }

  throw error;
}

export async function getBookingHistory(userId: number) {
  return findBookingsByUserId(userId);
}

export async function createBooking(userId: number, bookingData: NewBookingData) {
  const pnr = `RY${randomBytes(6).toString("hex").toUpperCase()}`;

  try {
    return await createBookingTransaction({ ...bookingData, userId, pnr });
  } catch (error) {
    convertRepositoryError(error);
  }
}

export async function getBookingByPnr(
  pnr: string,
  userId: number,
  role: "ADMIN" | "CLIENT",
) {
  const booking = await findBookingByPnr(pnr.toUpperCase());

  if (!booking || (role === "CLIENT" && booking.userId !== userId)) {
    throw new BookingWorkflowError("PNR_NOT_FOUND");
  }

  const { userId: _ownerId, ...safeBooking } = booking;
  return safeBooking;
}

export async function cancelBooking(
  bookingId: number,
  userId: number,
  role: "ADMIN" | "CLIENT",
) {
  try {
    return await cancelBookingTransaction(bookingId, userId, role);
  } catch (error) {
    convertRepositoryError(error);
  }
}