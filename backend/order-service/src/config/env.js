require("dotenv").config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000,

  db: {
    host: process.env.DB_HOST || "db",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "app",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "ecommerce",
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  },
};
