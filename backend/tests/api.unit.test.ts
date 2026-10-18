import http from "http";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import orderRoutes from "../src/routes/order.routes.js";
import authRoutes from "../src/routes/auth.routes.js";
import { prisma } from "../src/lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "sarh-super-secret-jwt-key-for-operations-console";

async function runUnitTests() {
  console.log("==================================================================");
  console.log("SARH ORDERS CONSOLE: COMPREHENSIVE UNIT TEST SUITE");
  console.log("==================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`, details || "");
      failed++;
    }
  }

  // 1. Setup local test server
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api", orderRoutes);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}/api`;

  // Pre-generate valid test tokens
  const adminToken = jwt.sign(
    { id: "test-admin-id", email: "admin@sarh.ai", role: "ADMIN" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const agentToken = jwt.sign(
    { id: "test-agent-id", email: "agent@sarh.ai", role: "AGENT" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  try {
    // -------------------------------------------------------------
    // TEST 1: Server-Side Pagination
    // -------------------------------------------------------------
    console.log("\n[1] Testing Server-Side Pagination & System Stats...");
    const res1 = await fetch(`${baseUrl}/orders?page=1&pageSize=10`);
    const data1 = await res1.json();

    assert(res1.status === 200, "Pagination endpoint returns HTTP 200");
    assert(Array.isArray(data1.data) && data1.data.length === 10, "Returns exactly 10 orders for pageSize=10");
    assert(data1.pagination.totalRecords >= 10, "Pagination totalRecords is accurate");
    assert(data1.systemStats.totalSystemRecords >= 10, "systemStats.totalSystemRecords exists and is populated");
    assert(typeof data1.systemStats.statusCounts === "object", "systemStats.statusCounts breakdown is provided");

    // -------------------------------------------------------------
    // TEST 2: Status Filtering
    // -------------------------------------------------------------
    console.log("\n[2] Testing Status Filtering...");
    const res2 = await fetch(`${baseUrl}/orders?status=COMPLETED&pageSize=5`);
    const data2 = await res2.json();

    assert(res2.status === 200, "Status filter endpoint returns HTTP 200");
    assert(
      data2.data.every((o: any) => o.status === "COMPLETED"),
      "All returned orders match status COMPLETED"
    );

    // -------------------------------------------------------------
    // TEST 3: Sorting Options
    // -------------------------------------------------------------
    console.log("\n[3] Testing Dynamic Sorting...");
    const res3 = await fetch(`${baseUrl}/orders?sortBy=totalAmount&sortOrder=desc&pageSize=5`);
    const data3 = await res3.json();

    assert(res3.status === 200, "Sort endpoint returns HTTP 200");
    const amounts = data3.data.map((o: any) => o.totalAmount);
    const isSortedDesc = amounts.every((val: number, i: number) => i === 0 || amounts[i - 1] >= val);
    assert(isSortedDesc, "Orders are sorted in descending order of totalAmount");

    // -------------------------------------------------------------
    // TEST 4: Input Validation on Order Creation
    // -------------------------------------------------------------
    console.log("\n[4] Testing Zod Validation on Order Creation...");
    const res4 = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify({
        customerName: "", // Invalid empty name
        customerEmail: "not-an-email", // Invalid email
        items: [] // Invalid empty items
      })
    });
    const data4 = await res4.json();

    assert(res4.status === 400, "Invalid payload returns HTTP 400");
    assert(data4.error === "Validation failed", "Error message identifies validation failure");

    // -------------------------------------------------------------
    // TEST 5: Order Creation & Idempotency Replay
    // -------------------------------------------------------------
    console.log("\n[5] Testing Order Creation & Idempotency Key Replay...");
    const idempotencyKey = crypto.randomUUID();
    const orderPayload = {
      customerName: "Unit Test Customer",
      customerEmail: "unit.test@sarh.ai",
      status: "PENDING",
      items: [
        { productName: "Test Desk Mat", quantity: 2, unitPrice: 45 },
        { productName: "USB Cable", quantity: 1, unitPrice: 30 }
      ]
    };

    const res5 = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(orderPayload)
    });
    const data5 = await res5.json();

    assert(res5.status === 201, "Creates order and returns HTTP 201");
    assert(data5.orderNumber && data5.totalAmount === 120, "Calculates correct totalAmount ($120)");
    assert(data5.items.length === 2, "Creates associated OrderItems");

    // Replay with exact same idempotency key
    const res5Replay = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(orderPayload)
    });
    const data5Replay = await res5Replay.json();

    assert(res5Replay.status === 201, "Idempotent replay returns HTTP 201");
    assert(
      res5Replay.headers.get("idempotent-replayed") === "true",
      "Response header contains 'Idempotent-Replayed: true'"
    );
    assert(data5Replay.id === data5.id, "Replay returns the exact same order ID without duplication");

    // -------------------------------------------------------------
    // TEST 6: RBAC Protection on Delete (Section 3)
    // -------------------------------------------------------------
    console.log("\n[6] Testing RBAC Delete Security Guardrails...");
    const testOrderId = data5.id;

    // 6a: Delete without token
    const resNoAuth = await fetch(`${baseUrl}/orders/${testOrderId}`, { method: "DELETE" });
    assert(resNoAuth.status === 401, "Delete without token rejected with HTTP 401 Unauthorized");

    // 6b: Delete with Agent token (RBAC block)
    const resAgent = await fetch(`${baseUrl}/orders/${testOrderId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${agentToken}` }
    });
    assert(resAgent.status === 403, "Agent role delete rejected with HTTP 403 Forbidden");

    // 6c: Delete with Admin token (Allowed)
    const resAdmin = await fetch(`${baseUrl}/orders/${testOrderId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const deleteJson = await resAdmin.json();

    assert(resAdmin.status === 200, "Admin role delete succeeds with HTTP 200 OK");
    assert(deleteJson.ok === true && deleteJson.deletedOrder, "Delete returns deletedOrder payload for Undo");

    // -------------------------------------------------------------
    // TEST 7: Undo Deletion (Restore Endpoint)
    // -------------------------------------------------------------
    console.log("\n[7] Testing Undo / Restore Endpoint...");
    const resRestore = await fetch(`${baseUrl}/orders/restore`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ order: deleteJson.deletedOrder })
    });
    const restoreJson = await resRestore.json();

    assert(resRestore.status === 201, "Restore returns HTTP 201 Created");
    assert(restoreJson.order.id === testOrderId, "Restored order preserves original ID");
    assert(restoreJson.order.items.length === 2, "Restored order preserves all line items");

    // Verify in database directly
    const dbOrder = await prisma.order.findUnique({
      where: { id: testOrderId },
      include: { items: true }
    });
    assert(dbOrder !== null && dbOrder.items.length === 2, "Direct DB check confirms restored order exists");

    // Clean up test order
    await prisma.order.delete({ where: { id: testOrderId } });

    // -------------------------------------------------------------
    // TEST 8: Bulk Operations (Bulk Status & Bulk Delete / Restore)
    // -------------------------------------------------------------
    console.log("\n[8] Testing Bulk Operations & Bulk Undo...");
    // Create 2 temporary orders
    const o1 = await prisma.order.create({
      data: {
        orderNumber: `ORD-BULK-01`,
        customerName: "Bulk User 1",
        customerEmail: "bulk1@sarh.ai",
        status: "PENDING",
        totalAmount: 100
      }
    });
    const o2 = await prisma.order.create({
      data: {
        orderNumber: `ORD-BULK-02`,
        customerName: "Bulk User 2",
        customerEmail: "bulk2@sarh.ai",
        status: "PENDING",
        totalAmount: 200
      }
    });

    // 8a: Bulk Status Update
    const resBulkStatus = await fetch(`${baseUrl}/orders/bulk-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${agentToken}`
      },
      body: JSON.stringify({ ids: [o1.id, o2.id], status: "PROCESSING" })
    });
    const bulkStatusJson = await resBulkStatus.json();
    assert(resBulkStatus.status === 200 && bulkStatusJson.count === 2, "Bulk status updates 2 orders to PROCESSING");

    // 8b: Bulk Delete
    const resBulkDelete = await fetch(`${baseUrl}/orders/bulk-delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ ids: [o1.id, o2.id] })
    });
    const bulkDeleteJson = await resBulkDelete.json();
    assert(resBulkDelete.status === 200 && bulkDeleteJson.count === 2, "Bulk delete deletes 2 orders");
    assert(bulkDeleteJson.deletedOrders.length === 2, "Bulk delete returns deleted orders for undo");

    // 8c: Bulk Restore (Undo)
    const resBulkRestore = await fetch(`${baseUrl}/orders/bulk-restore`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ orders: bulkDeleteJson.deletedOrders })
    });
    const bulkRestoreJson = await resBulkRestore.json();
    assert(resBulkRestore.status === 200 && bulkRestoreJson.restoredCount === 2, "Bulk restore successfully recovers all orders");

    // Clean up bulk test orders
    await prisma.order.deleteMany({ where: { id: { in: [o1.id, o2.id] } } });

  } finally {
    await prisma.$disconnect();
    await new Promise((r) => server.close(r));
  }

  console.log("\n==================================================================");
  console.log(`UNIT TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================\n");

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runUnitTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
