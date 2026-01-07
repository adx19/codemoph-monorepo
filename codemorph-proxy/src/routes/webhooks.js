// src/routes/webhooks.js
import express from "express";
import crypto from "crypto";
import { pool } from "../db.js";

const router = express.Router();
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["x-razorpay-signature"];
    const body = req.body;

    const expected = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== signature) {
      return res.status(400).send("invalid signature");
    }

    const payload = JSON.parse(body.toString());

    if (payload.event !== "payment.captured") {
      return res.json({ ok: true });
    }

    const payment = payload.payload.payment.entity;
    const amount = payment.amount;
    const paymentId = payment.id;
    const notes = payment.notes || {};
    const userId = notes.userId;

    if (!userId) {
      return res.json({ ok: true });
    }

    const creditsToAdd = Math.floor(amount / 100);
    const conn = await pool.connect();

    try {
      await conn.query("BEGIN");

      // 🔐 Idempotency check (DB-enforced)
      const exists = await conn.query(
        `
        SELECT 1
        FROM transactions
        WHERE type = 'purchase'
          AND meta->>'payment_id' = $1
        LIMIT 1
        `,
        [paymentId]
      );

      if (exists.rows.length) {
        await conn.query("ROLLBACK");
        return res.json({ ok: true });
      }

      await conn.query(
        `
        INSERT INTO purchased_credits
        (id, user_id, paid_credits, plan_type, start_date, end_date)
        VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '1 month')
        `,
        [
          crypto.randomUUID(),
          userId,
          creditsToAdd,
          "razorpay_monthly",
        ]
      );

      await conn.query(
        `
        INSERT INTO transactions
        (id, user_id, type, amount, credit_source, meta)
        VALUES ($1, $2, 'purchase', $3, 'paid', $4)
        `,
        [
          crypto.randomUUID(),
          userId,
          creditsToAdd,
          JSON.stringify({
            provider: "razorpay",
            payment_id: paymentId,
          }),
        ]
      );

      await conn.query(
        `
        UPDATE users
        SET is_paid = true
        WHERE id = $1
        `,
        [userId]
      );

      await conn.query("COMMIT");
      res.json({ ok: true });
    } catch (err) {
      await conn.query("ROLLBACK");
      console.error("RAZORPAY WEBHOOK ERROR:", err);
      res.status(500).json({ ok: false });
    } finally {
      conn.release();
    }
  }
);

export default router;
