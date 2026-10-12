import prisma from "../utils/prisma.js";

export type NewUserData = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export async function findUserByEmailOrPhone(
  email: string,
  phone: string,
) {
  return prisma.user.findMany({
    where: {
      OR: [{ email }, { phone }],
    },
    select: {
      email: true,
      phone: true,
    },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      password: true,
      role: true,
      isBlocked: true,
    },
  });
}

export async function findUserProfileById(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });
}

export async function createUser(userData: NewUserData) {
  return prisma.user.create({
    data: userData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// Admin: get all users without exposing passwords.
export async function findAllUsersForAdmin() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isBlocked: true,
      createdAt: true,
    },
  });
}

// Admin: block or unblock a client account.
export async function setUserBlockedStatus(
  id: number,
  isBlocked: boolean,
) {
  return prisma.user.update({
    where: { id },
    data: { isBlocked },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isBlocked: true,
      createdAt: true,
    },
  });
}