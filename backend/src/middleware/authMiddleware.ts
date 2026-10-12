import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";

type AuthenticatedRole = "ADMIN" | "CLIENT";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: AuthenticatedRole;
      };
    }
  }
}

const authMiddleware: RequestHandler = async (request, response, next) => {
  const authorizationHeader = request.header("Authorization");
  const bearerToken = authorizationHeader?.match(/^Bearer\s+(\S+)$/i)?.[1];

  if (!bearerToken) {
    response.status(401).json({ message: "Authentication required" });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    next(new Error("JWT_SECRET is not configured"));
    return;
  }

  let userId: number;
  let tokenRole: unknown;

  try {
    const payload = jwt.verify(bearerToken, jwtSecret);

    if (typeof payload === "string") {
      response.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    userId = Number(payload.userId ?? payload.sub);
    tokenRole = payload.role;

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0 ||
      (tokenRole !== "ADMIN" && tokenRole !== "CLIENT")
    ) {
      response.status(401).json({ message: "Authentication required" });
      return;
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      response.status(401).json({ message: "Token has expired" });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      response.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    next(error);
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        isBlocked: true,
      },
    });

    if (!user) {
      response.status(401).json({ message: "User account not found" });
      return;
    }

    if (user.isBlocked) {
      response.status(403).json({ message: "Your account has been blocked" });
      return;
    }

    request.user = {
      userId: user.id,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;