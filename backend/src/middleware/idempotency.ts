import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

/**
 * Idempotency Middleware for Order Creation (R2):
 * 
 * Guarantees that duplicate requests (from double-clicks, mobile network retries,
 * or browser timeout auto-resends) carrying the same `Idempotency-Key` header
 * will NEVER create duplicate orders.
 * 
 * - If Key is unseen: Creates a record with status "PROCESSING".
 * - If Key is already "RESOLVED": Replays the cached response with `Idempotent-Replayed: true`.
 * - If Key is currently "PROCESSING": Rejects concurrent duplicate with 409 Conflict.
 */
export async function requireIdempotency(req: Request, res: Response, next: NextFunction) {
  // Idempotency applies to state-mutating requests (POST)
  if (req.method !== "POST") {
    return next();
  }

  const idempotencyKey = (req.headers["idempotency-key"] || req.body?.idempotencyKey) as string;

  if (!idempotencyKey) {
    return res.status(400).json({
      error: "Missing Idempotency-Key",
      message: "POST /api/orders requires an 'Idempotency-Key' header (UUIDv4) to prevent duplicate order creation."
    });
  }

  try {
    // 1. Check if record already exists
    const existing = await prisma.idempotencyRecord.findUnique({
      where: { key: idempotencyKey }
    });

    if (existing) {
      if (existing.status === "RESOLVED" && existing.responseBody) {
        // Safe replay of original order creation response
        res.setHeader("Idempotent-Replayed", "true");
        const cachedBody = JSON.parse(existing.responseBody);
        return res.status(existing.statusCode || 200).json(cachedBody);
      }

      if (existing.status === "PROCESSING") {
        // Concurrent in-flight request collision
        return res.status(409).json({
          error: "Concurrent Request",
          message: "An identical request with this Idempotency-Key is currently being processed. Please wait.",
          retryable: true
        });
      }
    }

    // 2. Reserve the key atomically by inserting status "PROCESSING"
    // If two parallel requests race here, the UNIQUE constraint on `key` will block the second one immediately!
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour TTL
    try {
      await prisma.idempotencyRecord.create({
        data: {
          key: idempotencyKey,
          status: "PROCESSING",
          expiresAt
        }
      });
    } catch (insertError: any) {
      // Prisma unique constraint violation code is P2002
      if (insertError.code === "P2002") {
        return res.status(409).json({
          error: "Concurrent Request Conflict",
          message: "Another process has already started processing this Idempotency-Key.",
          retryable: true
        });
      }
      throw insertError;
    }

    // Pass the key to downstream handlers
    (req as any).idempotencyKey = idempotencyKey;
    next();
  } catch (err: any) {
    console.error("Idempotency middleware error:", err);
    return res.status(500).json({ error: "Internal Server Error in Idempotency Processing" });
  }
}
