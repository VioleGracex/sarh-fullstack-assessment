import { Router, Request, Response } from "express";
import { z } from "zod";
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
 * Returns:
 * - data: Order[]
 * - pagination: current page, pageSize, totalFilteredRecords, totalPages
 * - systemStats: totalSystemRecords (constant DB count), statusCounts (never fluctuates on filter)
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

    // Parallel count, fetch, and system-wide telemetry using indexes
    const [orders, totalFilteredRecords, totalSystemRecords, statusGroupCounts, revenueAggregate] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          items: true
        }
      }),
      prisma.order.count({ where }),
      prisma.order.count(), // System-wide total, NEVER fluctuates when filtering!
      prisma.order.groupBy({
        by: ["status"],
        _count: { _all: true }
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true }
      })
    ]);

    const totalPages = Math.ceil(totalFilteredRecords / pageSize);

    // Map status breakdown
    const statusCounts: Record<string, number> = {
      ALL: totalSystemRecords,
      PENDING: 0,
      PROCESSING: 0,
      COMPLETED: 0,
      CANCELLED: 0
    };

    statusGroupCounts.forEach((group) => {
      statusCounts[group.status] = group._count._all;
    });

    return res.json({
      data: orders,
      pagination: {
        page,
        pageSize,
        totalRecords: totalFilteredRecords,
        totalSystemRecords,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      systemStats: {
        totalSystemRecords,
        statusCounts,
        totalRevenue: revenueAggregate._sum.totalAmount || 0
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
      if (idempotencyKey) {
        await prisma.idempotencyRecord.deleteMany({ where: { key: idempotencyKey } });
      }
      return res.status(400).json({
        error: "Validation failed",
        details: parseResult.error.flatten().fieldErrors
      });
    }

    const { customerName, customerEmail, status, items } = parseResult.data;
    const calculatedTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const createdOrder = await prisma.$transaction(async (tx) => {
      const highestOrder = await tx.order.findFirst({
        orderBy: { orderNumber: "desc" },
        select: { orderNumber: true }
      });
      let nextSeq = 1;
      if (highestOrder?.orderNumber) {
        const match = highestOrder.orderNumber.match(/\d+/);
        if (match) {
          nextSeq = parseInt(match[0], 10) + 1;
        }
      }
      let orderNumber = `ORD-${String(nextSeq).padStart(6, "0")}`;
      while (await tx.order.findUnique({ where: { orderNumber } })) {
        nextSeq++;
        orderNumber = `ORD-${String(nextSeq).padStart(6, "0")}`;
      }

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
    if (idempotencyKey) {
      await prisma.idempotencyRecord.deleteMany({
        where: { key: idempotencyKey }
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
 */
router.get("/orders/stats", async (_req: Request, res: Response) => {
  try {
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
