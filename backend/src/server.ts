import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import os from "os";
import authRoutes from "./routes/auth.routes.js";
import orderRoutes from "./routes/order.routes.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"]
  })
);
app.use(express.json());

// Health check endpoint
app.get(["/health", "/api/health"], (_req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Network information for Wi-Fi mobile QR code access
app.get("/api/network-info", (_req, res) => {
  const nets = os.networkInterfaces();
  const interfaces: Array<{ name: string; ip: string }> = [];

  for (const name of Object.keys(nets)) {
    const list = nets[name] || [];
    for (const net of list) {
      if (net.family === "IPv4" && !net.internal && !net.address.startsWith("169.254")) {
        interfaces.push({ name, ip: net.address });
      }
    }
  }

  // Prioritize active Wi-Fi / WLAN adapter
  const primary = interfaces.find(i => /wi-fi|wlan|wireless/i.test(i.name)) || interfaces[0];
  const localIp = primary ? primary.ip : "127.0.0.1";
  const port = 5173;

  res.json({
    localIp,
    port,
    wifiUrl: `http://${localIp}:${port}`,
    interfaces
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api", orderRoutes);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`SARH Orders Console API running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Orders endpoint: http://localhost:${PORT}/api/orders`);
});
