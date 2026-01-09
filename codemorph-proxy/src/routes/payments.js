import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { pool } from "../db.js";
import { apiKeyMiddleware } from "../auth.js";

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * CREATE ORDER
 * - Creates Razorpay order
 * - Attaches userId + credits in notes
 */
router.post("/create-order", apiKeyMiddleware, async (req, res) => {
  const userId = req.user.id;

  const amount = 99;   // INR
  const credits = 250;

  const order = await razorpay.orders.create({
    amount: amount * 100, // paise
    currency: "INR",
    receipt: crypto.randomUUID(),
    notes: {
      userId,     // 🔥 used by webhook via order fetch
      credits,    // 🔥 deterministic credits
    },
  });

  res.json({
    orderId: order.id,
    amount,
    credits,
    key: process.env.RAZORPAY_KEY_ID,
  });
});

/**
 * VERIFY PAYMENT (FRONTEND CONFIRMATION ONLY)
 * - NO DB writes here
 * - Webhook is the source of truth
 */
router.post("/verify", apiKeyMiddleware, async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
  } = req.body;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "payment_verification_failed" });
  }

  // ✅ Verified — webhook will handle DB writes
  res.json({ verified: true });
});

/**
 * PAYMENT HISTORY (READ ONLY)
 */
router.get("/", apiKeyMiddleware, async (req, res) => {
  const userId = req.user.id;

  const { rows: purchases } = await pool.query(
    `
    SELECT id, created_at, end_date
    FROM purchased_credits
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
    [userId]
  );

  const purchaseCount = purchases.length;
  const totalSpent = purchaseCount * 99;
  const currentPlan = purchaseCount > 0 ? "Pro" : "Free";

  const nextRenewal =
    purchaseCount > 0 && purchases[0].end_date
      ? purchases[0].end_date.toISOString()
      : null;

  const payments = purchases.map((p) => ({
    id: p.id,
    created_at: p.created_at,
    amount: 99,
  }));

  res.json({
    data: payments,
    currentPlan,
    totalSpent,
    nextRenewal,
  });
});

export default router;
