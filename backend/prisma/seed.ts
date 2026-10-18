import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

const FIRST_NAMES = [
  "Mohammed", "Abdullah", "Fahad", "Khalid", "Sara", "Noura", "Omar", "Sultan",
  "Fatima", "Reem", "Abdulrahman", "Huda", "Ali", "Zaid", "Layla", "Yousef",
  "Mona", "Saud", "Tariq", "Salma", "Bandar", "Nasser", "Lina", "Hamza", "Amal"
];

const LAST_NAMES = [
  "Al-Harbi", "Al-Otaibi", "Al-Ghamdi", "Al-Zahrani", "Al-Shehri", "Al-Dossari",
  "Al-Mutairi", "Al-Qahtani", "Al-Anzi", "Al-Shammari", "Al-Subaie", "Al-Bishi",
  "Al-Rashid", "Al-Hassan", "Al-Salem", "Al-Najjar", "Al-Amri", "Al-Khatib"
];

const DOMAINS = ["gmail.com", "sarh.ai", "yahoo.com", "outlook.com", "icloud.com", "company.sa"];

const PRODUCTS = [
  { name: "Ergonomic Office Chair", minPrice: 450, maxPrice: 1200 },
  { name: "Wireless Mechanical Keyboard", minPrice: 180, maxPrice: 450 },
  { name: "27-inch 4K Monitor", minPrice: 900, maxPrice: 2200 },
  { name: "USB-C Multiport Dock", minPrice: 120, maxPrice: 320 },
  { name: "Noise Cancelling Headset", minPrice: 250, maxPrice: 850 },
  { name: "Ultra-Fast NVMe SSD 1TB", minPrice: 280, maxPrice: 550 },
  { name: "Standing Desk Frame", minPrice: 800, maxPrice: 1800 },
  { name: "Webcam 1080p HD", minPrice: 150, maxPrice: 350 },
  { name: "Smart LED Desk Lamp", minPrice: 75, maxPrice: 190 },
  { name: "Wireless Vertical Mouse", minPrice: 90, maxPrice: 210 }
];

const STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"] as const;

function randomElement<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack = 120): Date {
  const now = Date.now();
  const past = now - daysBack * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

async function main() {
  console.log("🚀 Starting database seeding...");
  const startTime = Date.now();

  // 1. Clean existing records for clean idempotent runs
  console.log("🧹 Clearing old data...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.idempotencyRecord.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Users (Mandatory Section 3: Seed at least one admin and one agent user)
  console.log("👤 Creating seed users (Admin & Agent)...");
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const agentPasswordHash = await bcrypt.hash("agent123", 10);

  await prisma.user.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        email: "admin@sarh.ai",
        password: adminPasswordHash,
        role: "ADMIN"
      },
      {
        id: crypto.randomUUID(),
        email: "agent@sarh.ai",
        password: agentPasswordHash,
        role: "AGENT"
      }
    ]
  });

  // 3. Seed 50,000+ Orders with 1-5 line items each in fast batches
  const TOTAL_ORDERS = 50000;
  const BATCH_SIZE = 1000;
  const batches = TOTAL_ORDERS / BATCH_SIZE;

  console.log(`📦 Generating ${TOTAL_ORDERS.toLocaleString()} orders in batches of ${BATCH_SIZE}...`);

  for (let b = 0; b < batches; b++) {
    const ordersData: Array<{
      id: string;
      orderNumber: string;
      customerName: string;
      customerEmail: string;
      status: string;
      totalAmount: number;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    const itemsData: Array<{
      id: string;
      orderId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }> = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      const orderSeq = b * BATCH_SIZE + i + 1;
      const orderId = crypto.randomUUID();
      const firstName = randomElement(FIRST_NAMES);
      const lastName = randomElement(LAST_NAMES);
      const customerName = `${firstName} ${lastName}`;
      const customerEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, "")}${randomInt(1, 999)}@${randomElement(DOMAINS)}`;
      const status = randomElement(STATUSES);
      const createdAt = randomDate(150);

      // 1 to 5 line items
      const itemCount = randomInt(1, 5);
      let orderTotal = 0;

      for (let j = 0; j < itemCount; j++) {
        const prod = randomElement(PRODUCTS);
        const qty = randomInt(1, 4);
        const unitPrice = randomInt(prod.minPrice, prod.maxPrice);
        const subtotal = qty * unitPrice;
        orderTotal += subtotal;

        itemsData.push({
          id: crypto.randomUUID(),
          orderId,
          productName: prod.name,
          quantity: qty,
          unitPrice,
          subtotal
        });
      }

      ordersData.push({
        id: orderId,
        orderNumber: `ORD-${String(orderSeq).padStart(6, "0")}`,
        customerName,
        customerEmail,
        status,
        totalAmount: orderTotal,
        createdAt,
        updatedAt: createdAt
      });
    }

    // Insert orders and items in transaction per batch
    await prisma.$transaction([
      prisma.order.createMany({ data: ordersData }),
      prisma.orderItem.createMany({ data: itemsData })
    ]);

    if ((b + 1) % 10 === 0 || b + 1 === batches) {
      const progress = ((b + 1) * BATCH_SIZE).toLocaleString();
      console.log(`   ⏳ Seeded ${progress} / ${TOTAL_ORDERS.toLocaleString()} orders...`);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Finished seeding ${TOTAL_ORDERS.toLocaleString()} orders + items in ${duration}s!`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
