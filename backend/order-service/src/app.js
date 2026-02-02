// src/app.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const authMiddleware = require("../src/middlewares/auth");

// Routes
const ordersRouter = require("./routes/orders");
const couponsRouter = require("./routes/coupons");
const analyticsRouter = require("./routes/analytic");

const app = express();

// Middlewares
app.use(bodyParser.json());
app.use(express.json());

app.use(cors({
  origin: ["http://localhost:5173", "https://store.hailamdev.space", "https://api.store.hailamdev.space"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Routes
const OrderController = require('./controllers/OrderController');

// Guest checkout: POST /orders uses optionalAuth (allows guests)
app.post("/api/v1/orders", authMiddleware.optionalAuth, OrderController.create);

// Other order routes require authentication
app.use("/api/v1/orders", authMiddleware.auth, ordersRouter);
app.use("/api/v1/analytics", authMiddleware.auth, authMiddleware.checkRole('admin'), analyticsRouter);
app.use("/api/v1/coupons", couponsRouter);

app.use((err, req, res, next) => {
  console.error("[ERROR]", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error"
  });
});

module.exports = app;
