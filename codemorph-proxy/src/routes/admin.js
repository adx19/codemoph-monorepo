// src/routes/admin.js
import express from "express";
import { pool } from "../db.js";
import crypto from "crypto";

const router = express.Router();

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  throw new Error("ADMIN_TOKEN is not set; refusing to start");
}

// Hash both values so timingSafeEqual always compares equal-length buffers
// and the token length is not leaked through timing.
const ADMIN_TOKEN_DIGEST = crypto
  .createHash("sha256")
  .update(ADMIN_TOKEN)
  .digest();

function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-token"];

  if (typeof token !== "string" || !token) {
    return res.status(403).json({ message: "admin_only" });
  }

  const tokenDigest = crypto.createHash("sha256").update(token).digest();

  if (!crypto.timingSafeEqual(tokenDigest, ADMIN_TOKEN_DIGEST)) {
    return res.status(403).json({ message: "admin_only" });
  }

  next();
}

router.post("/topup", requireAdmin, async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount) {
    return res.status(400).json({ message: "missing params" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE users
       SET credits = credits + $1
       WHERE id = $2`,
      [amount, userId]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "user_not_found" });
    }

    await client.query(
      `INSERT INTO transactions
       (id, user_id, type, amount, credit_source, meta)
       VALUES ($1, $2, 'topup', $3, 'free', $4)`,
      [crypto.randomUUID(), userId, amount, JSON.stringify({ by: "admin" })]
    );

    await client.query("COMMIT");

    res.json({ ok: true });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Admin topup rollback failed:", rollbackErr);
    }
    console.error(err);
    res.status(500).json({ message: "server_error" });
  } finally {
    client.release();
  }
});

export default router;
