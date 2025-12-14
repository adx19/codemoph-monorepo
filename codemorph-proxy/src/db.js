import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import mysql from "mysql2/promise";

const isProduction = process.env.RAILWAY_ENVIRONMENT !== undefined;

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,

  // ✅ Railway requires SSL
  ssl: isProduction
    ? { rejectUnauthorized: false }
    : false,
});

// Log when DB connects
pool.getConnection()
  .then(conn => {
    console.log("✅ Database connected successfully.");
    conn.release();
  })
  .catch(err => {
    console.error("❌ Database connection failed:", err);
  });
