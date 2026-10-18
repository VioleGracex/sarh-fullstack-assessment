import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload {
  sub: string;
  role: "ADMIN" | "AGENT" | string;
  email?: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is missing");
  }
  return secret;
}

/**
 * Authentication Middleware:
 * FIX 1: Uses `jwt.verify` (cryptographic signature verification) instead of `jwt.decode`.
 * FIX 2: Only extracts from `Authorization: Bearer <token>` header (avoids query param log leakage).
 * FIX 3: Handles token expiration and malformed errors properly.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required",
      message: "Missing or malformed Authorization header. Expected format: Bearer <token>"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthPayload;
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired", message: "Your session has expired. Please log in again." });
    }
    return res.status(401).json({ error: "Invalid token", message: "Token verification failed." });
  }
}

/**
 * Role-Based Access Control (RBAC) Middleware:
 * FIX 4: Server-side authorization check (never trust client-side AdminOnly component).
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Access denied. Requires one of the following roles: [${allowedRoles.join(", ")}]. Current role: ${req.user.role}`
      });
    }

    next();
  };
}
