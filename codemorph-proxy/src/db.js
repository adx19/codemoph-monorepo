import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", () => {
  console.log("✅ Connected to Postgres");
});

pool.on("error", (err) => {
  console.error("❌ Postgres pool error", err);
  process.exit(1);
});
