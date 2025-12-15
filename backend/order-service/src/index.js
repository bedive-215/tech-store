// src/index.js
require("dotenv").config();

const http = require("http");
const app = require("./app");

const env = require("./config/env");
const { initDB, testConnection } = require("./config/db");
const rabbitmq = require("./config/rabbitmq");
const OrderService = require("./services/OrderService");

const PORT = env.port || 3000;

const server = http.createServer(app);

async function startServer() {
  try {
    await initDB();
    await testConnection();
    console.log("Database connected");

    await rabbitmq.connect();
    await OrderService.initMessageHandle();
    console.log("RabbitMQ connected");

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("Server startup failed:", err);
    process.exit(1);
  }
}

startServer();
