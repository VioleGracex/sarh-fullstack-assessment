import { Router, Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { requireIdempotency } from "../middleware/idempotency.js";

const router = Router();

// Zod validation schemas
const orderItemSchema = z.object({
  productName: z.string().min(1, "Product name cannot be empty"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().positive("Unit price must be positive")
});

const createOrderSchema = z.object({
  customerName: z.string().min(2, "Customer name must be at least 2 characters"),
  customerEmail: z.string().email("Valid customer email is required"),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"]).default("PENDING"),
  items: z.array(orderItemSchema).min(1, "At least 1 item is required").max(5, "Maximum 5 items allowed"),
  totalAmount: z.number().positive().optional()
});

/**
 * GET /api/orders
 * R1: High performance order list over 50,000+ rows
 * Supports: Search (name/email), Filter (status), Sort (date, amount), Server pagination
 */
router.get("/orders", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(10, parseInt(req.query.pageSize as string) || 25));
    const search = ((req.query.search as string) || "").trim();
    const status = (req.query.status as string) || "";
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? "asc" : "desc";

    // Build Prisma query filter
    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
        { orderNumber: { contains: search } }
      ];
    }

    // Dynamic sorting
    const orderBy: any = {};
    if (sortBy === "totalAmount") {
      orderBy.totalAmount = sortOrder;
    } else if (sortBy === "orderNumber") {
      orderBy.orderNumber = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const skip = (page - 1) * pageSize;

    // Parallel count and fetch using indexes
    const [orders, totalRecords] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          items: true
        }
      }),
      prisma.order.count({ where })
    ]);

    const totalPages = Math.ceil(totalRecords / pageSize);

    return res.json({
      data: orders,
      pagination: {
        page,
        pageSize,
        totalRecords,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ error: "Failed to retrieve orders" });
  }
});

/**
 * POST /api/orders
 * R2: Create order with guaranteed server-side duplicate prevention (Idempotency)
 */
router.post("/orders", requireIdempotency, async (req: Request, res: Response) => {
  const idempotencyKey = (req as any).idempotencyKey as string;

  try {
    const parseResult = createOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      // If validation fails, remove or fail the idempotency key so client can retry with valid input
      if (idempotencyKey) {
        await prisma.idempotencyRecord.deleteMany({ where: { key: idempotencyKey } });
      }
      return res.status(400).json({
        error: "Validation failed",
        details: parseResult.error.flatten().fieldErrors
      });
    }

    const { customerName, customerEmail, status, items } = parseResult.data;

    // Calculate total amount from items to guarantee financial integrity
    const calculatedTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    // Create Order and items inside an atomic transaction
    const createdOrder = await prisma.$transaction(async (tx) => {
      // Generate clean human-readable order number
      const count = await tx.order.count();
      const orderNumber = `ORD-${String(count + 1).padStart(6, "0")}`;

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName,
          customerEmail,
          status,
          totalAmount: calculatedTotal,
          idempotencyKey,
          items: {
            create: items.map((item) => ({
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.quantity * item.unitPrice
            }))
          }
        },
        include: {
          items: true
        }
      });

      // Update idempotency record to RESOLVED with cached response payload
      if (idempotencyKey) {
        await tx.idempotencyRecord.update({
          where: { key: idempotencyKey },
          data: {
            status: "RESOLVED",
            statusCode: 201,
            responseBody: JSON.stringify(order)
          }
        });
      }

      return order;
    });

    return res.status(201).json(createdOrder);
  } catch (error: any) {
    console.error("Error creating order:", error);
    // Mark idempotency as failed in case of unhandled error
    if (idempotencyKey) {
      await prisma.idempotencyRecord.updateMany({
        where: { key: idempotencyKey },
        data: { status: "FAILED" }
      });
    }
    return res.status(500).json({ error: "Failed to create order" });
  }
});

/**
 * DELETE /api/orders/:id
 * Section 3: Protected by server-side requireAuth AND requireRole("ADMIN")
 */
router.delete("/orders/:id", requireAuth, requireRole("ADMIN"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.order.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: "Order not found" });
    }

    await prisma.order.delete({ where: { id } });

    return res.json({
      ok: true,
      message: `Order ${existing.orderNumber} deleted successfully by admin.`
    });
  } catch (error) {
    console.error("Delete order error:", error);
    return res.status(500).json({ error: "Failed to delete order" });
  }
});

/**
 * GET /api/orders/stats
 * Optional O1: Deliberately slow stats endpoint (3.5 seconds)
 * Returns status aggregates and revenue metrics
 */
router.get("/orders/stats", async (_req: Request, res: Response) => {
  try {
    // Deliberate 3.5s delay to satisfy Optional O1
    await new Promise((resolve) => setTimeout(resolve, 3500));

    const [statusCounts, revenueResult] = await Promise.all([
      prisma.order.groupBy({
        by: ["status"],
        _count: { _all: true }
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        _avg: { totalAmount: true }
      })
    ]);

    const formattedCounts = statusCounts.reduce((acc: Record<string, number>, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {});

    return res.json({
      totalsByStatus: formattedCounts,
      totalRevenue: revenueResult._sum.totalAmount || 0,
      averageOrderValue: Math.round(revenueResult._avg.totalAmount || 0),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return res.status(500).json({ error: "Failed to compute order statistics" });
  }
});

export default router;
