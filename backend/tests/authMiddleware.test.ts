import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the shared Prisma client so tests run in isolation without a database
vi.mock("../src/utils/prisma.js", () => {
  return {
    default: {
      user: {
        findUnique: vi.fn(),
      },
    },
  };
});

import authMiddleware from "../src/middleware/authMiddleware.js";
import { authorizeRole } from "../src/middleware/authorizeRole.js";
import prisma from "../src/utils/prisma.js";

// Use existing environment secret or fallback test secret
const TEST_JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-for-unit-tests-only";

// Helper to create an Express Request mock
function createMockRequest(authorizationHeader?: string): Request {
  const req = {
    header: vi.fn((headerName: string) => {
      if (headerName.toLowerCase() === "authorization") {
        return authorizationHeader;
      }
      return undefined;
    }),
    user: undefined,
  };
  return req as unknown as Request;
}

// Helper to create an Express Response mock
function createMockResponse() {
  const res: {
    statusCode: number;
    body: unknown;
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  } = {
    statusCode: 200,
    body: null,
    status: vi.fn(function (this: any, code: number) {
      this.statusCode = code;
      return this;
    }),
    json: vi.fn(function (this: any, data: unknown) {
      this.body = data;
      return this;
    }),
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe("authMiddleware Unit Tests", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    vi.clearAllMocks();
  });

  // Scenario 1: Valid token and active user
  it("Scenario 1: allows a valid token and active user, setting req.user with database values", async () => {
    const mockDbUser = {
      id: 10,
      role: "CLIENT" as const,
      isBlocked: false,
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockDbUser as any);

    const validToken = jwt.sign({ userId: 10, role: "CLIENT" }, TEST_JWT_SECRET);
    const req = createMockRequest(`Bearer ${validToken}`);
    const res = createMockResponse();
    const next: NextFunction = vi.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({
      userId: 10,
      role: "CLIENT",
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 10 },
      select: { id: true, role: true, isBlocked: true },
    });
  });

  // Scenario 2: Invalid token
  it("Scenario 2: responds with HTTP 401 when given an invalid token", async () => {
    const req = createMockRequest("Bearer invalid-token-string");
    const res = createMockResponse();
    const next: NextFunction = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid or expired token",
    });
    expect(next).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  // Scenario 3: Expired token
  it("Scenario 3: responds with HTTP 401 and 'Token has expired' message for an expired token", async () => {
    const expiredToken = jwt.sign(
      { userId: 10, role: "CLIENT" },
      TEST_JWT_SECRET,
      { expiresIn: "-1s" },
    );
    const req = createMockRequest(`Bearer ${expiredToken}`);
    const res = createMockResponse();
    const next: NextFunction = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Token has expired",
    });
    expect(next).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  // Scenario 4: User not found in database
  it("Scenario 4: responds with HTTP 401 when user account does not exist in database", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const validToken = jwt.sign({ userId: 999, role: "CLIENT" }, TEST_JWT_SECRET);
    const req = createMockRequest(`Bearer ${validToken}`);
    const res = createMockResponse();
    const next: NextFunction = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "User account not found",
    });
    expect(next).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  // Scenario 5: Blocked user
  it("Scenario 5: responds with HTTP 403 when user account is blocked in the database", async () => {
    const blockedDbUser = {
      id: 11,
      role: "CLIENT" as const,
      isBlocked: true,
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(blockedDbUser as any);

    const validToken = jwt.sign({ userId: 11, role: "CLIENT" }, TEST_JWT_SECRET);
    const req = createMockRequest(`Bearer ${validToken}`);
    const res = createMockResponse();
    const next: NextFunction = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Your account has been blocked",
    });
    expect(next).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  // Scenario 6: Unblocked user
  it("Scenario 6: allows request when user account is active/unblocked in the database", async () => {
    const unblockedDbUser = {
      id: 11,
      role: "CLIENT" as const,
      isBlocked: false,
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(unblockedDbUser as any);

    const validToken = jwt.sign({ userId: 11, role: "CLIENT" }, TEST_JWT_SECRET);
    const req = createMockRequest(`Bearer ${validToken}`);
    const res = createMockResponse();
    const next: NextFunction = vi.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({
      userId: 11,
      role: "CLIENT",
    });
  });

  // Scenario 7: Role mismatch (JWT says ADMIN, DB says CLIENT)
  it("Scenario 7: enforces current database role over stale JWT role, which subsequent authorizeRole rejects", async () => {
    // Database has demoted or set this user to CLIENT
    const clientDbUser = {
      id: 12,
      role: "CLIENT" as const,
      isBlocked: false,
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(clientDbUser as any);

    // Old or tampered JWT claims user has ADMIN role
    const staleAdminToken = jwt.sign({ userId: 12, role: "ADMIN" }, TEST_JWT_SECRET);
    const req = createMockRequest(`Bearer ${staleAdminToken}`);
    const res = createMockResponse();
    const next: NextFunction = vi.fn();

    await authMiddleware(req, res, next);

    // 1. authMiddleware sets the actual database role, NOT the stale JWT role
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user?.role).toBe("CLIENT");
    expect(req.user?.role).not.toBe("ADMIN");

    // 2. Demonstrate how separate authorizeRole('ADMIN') blocks this request
    const adminOnlyMiddleware = authorizeRole("ADMIN");
    const adminRes = createMockResponse();
    const adminNext: NextFunction = vi.fn();

    adminOnlyMiddleware(req, adminRes, adminNext);

    expect(adminRes.status).toHaveBeenCalledWith(403);
    expect(adminRes.json).toHaveBeenCalledWith({
      message: "You do not have permission",
    });
    expect(adminNext).not.toHaveBeenCalled();
  });

  // Scenario 8: Unexpected database error
  it("Scenario 8: forwards unexpected database errors to Express next(error)", async () => {
    const dbError = new Error("Database connection timed out");
    vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(dbError);

    const validToken = jwt.sign({ userId: 10, role: "CLIENT" }, TEST_JWT_SECRET);
    const req = createMockRequest(`Bearer ${validToken}`);
    const res = createMockResponse();
    const next: NextFunction = vi.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(dbError);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
