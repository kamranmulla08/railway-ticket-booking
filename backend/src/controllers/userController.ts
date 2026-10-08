import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  DuplicateEmailError,
  DuplicatePhoneError,
  InvalidCredentialsError,
  getUserProfile,
  loginUser,
  registerUser,
} from "../services/userService.js";

const registrationSchema = z
  .object({
    name: z.string().trim().min(1),
    email: z.string().trim().email(),
    phone: z.string().trim().min(1),
    password: z.string().min(8),
    role: z.enum(["ADMIN", "CLIENT"]).optional(),
  })
  .strict();

const loginSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(1),
  })
  .strict();

export async function registerUserController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const validation = registrationSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      message: "Invalid registration details",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  if (validation.data.role === "ADMIN") {
    response.status(400).json({
      message: "Only CLIENT registrations are allowed. The role is assigned by the system.",
    });
    return;
  }

  try {
    const { role: _role, ...userData } = validation.data;
    const user = await registerUser(userData);

    response.status(201).json({
      message: "Registration successful",
      user,
    });
  } catch (error) {
    if (error instanceof DuplicateEmailError || error instanceof DuplicatePhoneError) {
      response.status(409).json({ message: error.message });
      return;
    }

    next(error);
  }
}

export async function loginUserController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const validation = loginSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      message: "Invalid login details",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const result = await loginUser(
      validation.data.email,
      validation.data.password,
    );

    response.status(200).json(result);
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      response.status(401).json({ message: error.message });
      return;
    }

    next(error);
  }
}

export async function getMeController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  if (!request.user) {
    response.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const user = await getUserProfile(request.user.userId);

    if (!user) {
      response.status(404).json({ message: "User not found" });
      return;
    }

    response.status(200).json(user);
  } catch (error) {
    next(error);
  }
}