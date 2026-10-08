import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

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

const authMiddleware: RequestHandler = (request, response, next) => {
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

  try {
    const payload = jwt.verify(bearerToken, jwtSecret);

    if (typeof payload === "string") {
      response.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    const userId = Number(payload.userId ?? payload.sub);
    const role = payload.role;

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0 ||
      (role !== "ADMIN" && role !== "CLIENT")
    ) {
      response.status(401).json({ message: "Authentication required" });
      return;
    }

    request.user = { userId, role };
    next();
  } catch {
    response.status(401).json({ message: "Authentication required" });
  }
};

export default authMiddleware;