import type { RequestHandler } from "express";

type UserRole = "ADMIN" | "CLIENT";

export function authorizeRole(requiredRole: UserRole): RequestHandler {
  return (request, response, next) => {
    if (!request.user) {
      response.status(401).json({ message: "Authentication required" });
      return;
    }

    if (request.user.role !== requiredRole) {
      response.status(403).json({ message: "You do not have permission" });
      return;
    }

    next();
  };
}