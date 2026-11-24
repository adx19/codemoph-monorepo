// src/routes/webhooks.js
import express from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import { pool } from "../db.js";

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  async (req, res) => {

    console.log("🔥 RAZORPAY WEBHOOK HIT");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("❌ Razorpay webhook: RAZORPAY_WEBHOOK_SECRET is not set");
      return res.status(500).json({ ok: false });
    }

    const signature = req.headers["x-razorpay-signature"];
    const body = req.body;

    const expectedBuf = Buffer.from(
      crypto.createHmac("sha256", webhookSecret).update(body).digest("hex"),
      "utf8"
    );
    const receivedBuf = Buffer.from(
      typeof signature === "string" ? signature : "",
      "utf8"
    );

    // timingSafeEqual throws on unequal lengths, so check length first.
    if (
      receivedBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(receivedBuf, expectedBuf)
    ) {
      console.error("❌ Razorpay webhook: invalid signature");
      return res.status(400).send("invalid signature");
    }

    const payload = JSON.parse(body.toString());

    if (payload.event !== "payment.captured") {
      return res.json({ ok: true });
    }

    const payment = payload.payload.payment.entity;
    const paymentId = payment.id;
    const orderId = payment.order_id;

    // 🔥 CRITICAL FIX: fetch order
    let order;
    try {
      order = await razorpay.orders.fetch(orderId);
    } catch (err) {
      // 500 makes Razorpay retry the webhook later.
      console.error("❌ Razorpay webhook: failed to fetch order", orderId, err);
      return res.status(500).json({ ok: false });
    }

    const userId = order.notes?.userId;
    const creditsToAdd = Number(order.notes?.credits);

    if (!userId || !creditsToAdd) {
      console.error("❌ Missing metadata", { userId, creditsToAdd });
      return res.status(400).json({ ok: false });
    }

    const conn = await pool.connect();

    try {
      await conn.query("BEGIN");

      // 🔐 Idempotency check
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
        VALUES
          ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '1 month')
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
        VALUES
          ($1, $2, 'purchase', $3, 'paid', $4)
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

      console.log("✅ Credited user", userId, "for payment", paymentId);
      res.json({ ok: true });
    } catch (err) {
      await conn.query("ROLLBACK");
      console.error("❌ RAZORPAY WEBHOOK ERROR:", err);
      res.status(500).json({ ok: false });
    } finally {
      conn.release();
    }
  }
);

export default router;
