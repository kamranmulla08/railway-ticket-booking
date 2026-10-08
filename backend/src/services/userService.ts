import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createUser,
  findUserByEmail,
  findUserByEmailOrPhone,
  findUserProfileById,
  type NewUserData,
} from "../repositories/userRepository.js";

export class DuplicateEmailError extends Error {
  constructor() {
    super("An account with this email already exists");
    this.name = "DuplicateEmailError";
  }
}

export class DuplicatePhoneError extends Error {
  constructor() {
    super("An account with this phone number already exists");
    this.name = "DuplicatePhoneError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password");
    this.name = "InvalidCredentialsError";
  }
}

export async function registerUser(userData: NewUserData) {
  const email = userData.email.toLowerCase();
  const existingUsers = await findUserByEmailOrPhone(email, userData.phone);

  if (existingUsers.some((user) => user.email === email)) {
    throw new DuplicateEmailError();
  }

  if (existingUsers.some((user) => user.phone === userData.phone)) {
    throw new DuplicatePhoneError();
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);

  return createUser({
    ...userData,
    email,
    password: hashedPassword,
  });
}

export async function loginUser(email: string, password: string) {
  const user = await findUserByEmail(email.toLowerCase());

  // Compare the submitted password to its stored hash without exposing either value.
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new InvalidCredentialsError();
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  // Sign the user's ID and role so protected requests can identify the user.
  const token = jwt.sign(
    { sub: String(user.id), role: user.role },
    jwtSecret,
    { expiresIn: "1h" },
  );

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    token,
  };
}

export async function getUserProfile(userId: number) {
  return findUserProfileById(userId);
}