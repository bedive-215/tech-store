// src/index.js
require("dotenv").config();
const express = require("express");
const env = require("./config/env");
const { initDB, testConnection } = require("./config/db");

// Routers
const ordersRouter = require("./routes/orders");
const paymentsRouter = require("./routes/payments");
const couponsRouter = require("./routes/coupons");

// Middleware
// const auth = require("./middleware/auth");

async function startServer() {
  // 1. Khởi tạo database + tables
  await initDB();

  // 2. Kiểm tra kết nối DB
  await testConnection();

  const app = express();
  app.use(express.json());

  // 3. Mount middleware auth nếu cần
  // app.use("/api/v1", auth);

  // 4. Mount routes
  app.use("/api/v1/orders", ordersRouter);
  app.use("/api/v1/payments", paymentsRouter);
  app.use("/api/v1/coupons", couponsRouter);

  // 5. Health check
  app.get("/healthz", (req, res) => res.json({ status: "ok" }));

  // 6. Global error handler
  app.use((err, req, res, next) => {
    console.error("[ERROR]", err);
    res.status(err.status || 500).json({ error: err.message || "Internal server error" });
  });

  // 7. Start server
  app.listen(env.port, () => {
    console.log(`🚀 Server running on port ${env.port}`);
  });
}

startServer();
