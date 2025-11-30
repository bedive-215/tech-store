// src/config/db.js
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const env = require("./env");

// 1. Pool kết nối MySQL (sẽ connect vào database đã có)
const pool = mysql.createPool({
  host: env.db.host,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  port: env.db.port,
  connectionLimit: env.db.connectionLimit,
});

// 2. Test kết nối
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    console.log("✅ MySQL connection OK");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err);
    process.exit(1);
  }
}

// 3. Khởi tạo database + table từ file init.sql
async function initDB() {
  try {
    // Connect vào MySQL server (chưa có database)
    const conn = await mysql.createConnection({
      host: env.db.host,
      user: env.db.user,
      password: env.db.password,
      port: env.db.port,
      multipleStatements: true,
    });

    // Tạo database nếu chưa có
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${env.db.database}\`;`);
    console.log(`✅ Database '${env.db.database}' checked/created`);

    // Connect vào database vừa tạo
    await conn.changeUser({ database: env.db.database });

    // Đọc file init.sql và chạy
    const sqlFile = path.join(__dirname, "../../sql/init.sql");
    const sql = fs.readFileSync(sqlFile, "utf8");
    await conn.query(sql);
    console.log("✅ Tables initialized from init.sql");

    await conn.end();
  } catch (err) {
    console.error("❌ initDB failed:", err);
    process.exit(1);
  }
}

// Export pool as default, nhưng vẫn expose helper functions as properties
module.exports = pool;
module.exports.testConnection = testConnection;
module.exports.initDB = initDB;
