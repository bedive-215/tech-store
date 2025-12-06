require("dotenv").config();
const express = require("express");
const cors = require("cors");   // <-- thêm dòng này
const env = require("./config/env");
const { initDB, testConnection } = require("./config/db");

// Routers
const ordersRouter = require("./routes/orders");
const paymentsRouter = require("./routes/payments");
const couponsRouter = require("./routes/coupons");

async function startServer() {
  await initDB();
  await testConnection();

  const app = express();
  app.use(express.json());

  // ✅ Thêm cấu hình CORS
  app.use(cors({
    origin: "http://localhost:5173",   // cho phép frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }));

  // Routes
  app.use("/api/v1/orders", ordersRouter);
  app.use("/api/v1/payments", paymentsRouter);
  app.use("/api/v1/coupons", couponsRouter);

  app.get("/healthz", (req, res) => res.json({ status: "ok" }));

  app.use((err, req, res, next) => {
    console.error("[ERROR]", err);
    res.status(err.status || 500).json({ error: err.message || "Internal server error" });
  });

  app.listen(env.port, () => {
    console.log(`🚀 Server running on port ${env.port}`);
  });
}

startServer();
