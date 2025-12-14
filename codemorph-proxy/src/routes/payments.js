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

router.post("/create-order", apiKeyMiddleware, async (req, res) => {
  const userId = req.user.id;

  const amount = 99; // ₹99
  const credits = 250;

  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: crypto.randomUUID(),
  });

  res.json({
    orderId: order.id,
    amount,
    credits,
    key: process.env.RAZORPAY_KEY_ID,
  });
});

router.post("/verify", apiKeyMiddleware, async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "payment_verification_failed" });
  }

  const credits = 250; // ✅ backend-controlled

await pool.query(
  `
  INSERT INTO purchased_credits
  (id, user_id, paid_credits, start_date, end_date)
  VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH))
  `,
  [crypto.randomUUID(), req.user.id, credits]
);


  await pool.query(
    `
    INSERT INTO transactions
    (id, user_id, type, amount, credit_source)
    VALUES (?, ?, 'purchase', ?, 'paid')
    `,
    [crypto.randomUUID(), req.user.id, credits]
  );

  await pool.query(
    "UPDATE users SET is_paid = 1 WHERE id = ?",
    [req.user.id]
  );

  res.json({ success: true });
});
router.get("/", apiKeyMiddleware, async (req, res) => {
  const userId = req.user.id;

  // 1️⃣ Fetch all purchased plans
  const [purchases] = await pool.query(
    `
    SELECT id, created_at, end_date
    FROM purchased_credits
    WHERE user_id = ?
    ORDER BY created_at DESC
    `,
    [userId]
  );

  const purchaseCount = purchases.length;

  // 2️⃣ Total spent = ₹99 per purchase
  const totalSpent = purchaseCount * 99;

  // 3️⃣ Current plan
  const currentPlan = purchaseCount > 0 ? "Pro" : "Free";

  // 4️⃣ Next renewal date (from most recent plan)
  const nextRenewal =
    purchaseCount > 0 && purchases[0].end_date
      ? purchases[0].end_date.toISOString()
      : null;

  // 5️⃣ Format payment list response
  const payments = purchases.map((p) => ({
    id: p.id,
    created_at: p.created_at,
    amount: 99, // fixed cost per plan
  }));

  res.json({
    data: payments,
    currentPlan,
    totalSpent,
    nextRenewal,
  });
});



export default router;
