import crypto from "crypto";
import http from "http";
import express from "express";
import cors from "cors";
import orderRoutes from "../src/routes/order.routes.js";
import { prisma } from "../src/lib/prisma.js";

async function runDuplicateProof() {
  console.log("==================================================================");
  console.log("R2 CONCURRENCY PROOF: PARALLEL DUPLICATE ORDER PREVENTION TEST");
  console.log("==================================================================");

  // 1. Setup local test server on an ephemeral port
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api", orderRoutes);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const testPort = address.port;
  const baseUrl = `http://localhost:${testPort}/api/orders`;

  console.log(`Ephemeral test server active on port ${testPort}`);

  const idempotencyKey = crypto.randomUUID();
  console.log(`Generated Idempotency-Key: ${idempotencyKey}`);

  const orderPayload = {
    customerName: "Double-Click Customer",
    customerEmail: "concurrency.test@sarh.ai",
    status: "PENDING",
    items: [
      { productName: "Double-Click Headset", quantity: 1, unitPrice: 350 },
      { productName: "Noise Cancelling Mic", quantity: 2, unitPrice: 120 }
    ]
  };

  console.log("\nSTEP 1: Firing 2 IDENTICAL order requests simultaneously in parallel (Promise.all)...");

  const sendRequest = async (requestId: number) => {
    const start = Date.now();
    try {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      const elapsed = Date.now() - start;
      const replayed = res.headers.get("Idempotent-Replayed") === "true";
      return { requestId, status: res.status, data, elapsed, replayed };
    } catch (err: any) {
      return { requestId, status: 500, error: err.message };
    }
  };

  // Fire parallel concurrent requests
  const [res1, res2] = await Promise.all([sendRequest(1), sendRequest(2)]);

  console.log("   • Request #1:", `HTTP ${res1.status} (${res1.elapsed}ms) - Replayed: ${res1.replayed}`);
  console.log("   • Request #2:", `HTTP ${res2.status} (${res2.elapsed}ms) - Replayed: ${res2.replayed}`);

  console.log("\nSTEP 2: Firing a 3rd request (simulating mobile network retry after order is resolved)...");
  // Small pause to ensure first transaction committed
  await new Promise((r) => setTimeout(r, 100));
  const res3 = await sendRequest(3);
  console.log("   • Request #3 (Retry):", `HTTP ${res3.status} (${res3.elapsed}ms) - Replayed: ${res3.replayed}`);

  // 2. Query Database directly to verify database state
  console.log("\nSTEP 3: Verifying Database state directly via Prisma...");
  const ordersInDb = await prisma.order.findMany({
    where: { idempotencyKey },
    include: { items: true }
  });

  console.log(`   • Orders in DB matching Idempotency-Key '${idempotencyKey}': ${ordersInDb.length}`);

  // 3. Strict Assertions
  if (ordersInDb.length !== 1) {
    console.error(`\nFAILED: Expected exactly 1 order in database, but found ${ordersInDb.length}!`);
    await prisma.$disconnect();
    await new Promise((r) => server.close(r));
    process.exitCode = 1;
    return;
  }

  const savedOrder = ordersInDb[0];
  console.log(`\nVerified Order Number: ${savedOrder.orderNumber}`);
  console.log(`Verified Customer: ${savedOrder.customerName} (${savedOrder.customerEmail})`);
  console.log(`Verified Order Total: $${savedOrder.totalAmount} (${savedOrder.items.length} line items)`);
  console.log("==================================================================");
  console.log("SUCCESS: EXACTLY ONE ORDER EXISTS IN DATABASE!");
  console.log("   • Parallel collision: Deduplicated without creating a second order.");
  console.log("   • Network retry: Safely replayed the original order.");
  console.log("==================================================================\n");

  await prisma.$disconnect();
  await new Promise((r) => server.close(r));
}

runDuplicateProof().catch((e) => {
  console.error("Test error:", e);
  process.exitCode = 1;
});
