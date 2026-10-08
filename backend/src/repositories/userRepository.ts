import prisma from "../utils/prisma.js";

export type NewUserData = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export async function findUserByEmailOrPhone(email: string, phone: string) {
  return prisma.user.findMany({
    where: {
      OR: [{ email }, { phone }],
    },
    select: { email: true, phone: true },
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