import express from "express";
import { pool } from "../db.js";
import { apiKeyMiddleware } from "../auth.js";
import crypto from "crypto";

const router = express.Router();

/**
 * ✅ GET — Credits I SHARED to others
 */
router.get("/sent", apiKeyMiddleware, async (req, res) => {
  const userId = req.user.id;

  const [rows] = await pool.query(
    `
    SELECT
      sc.shared_user_id,
      u.username AS shared_username,
      u.email AS shared_email,
      sc.start_date,
      sc.end_date
    FROM shared_credits sc
    JOIN users u ON u.id = sc.shared_user_id
    WHERE sc.owner_user_id = ?
      AND sc.end_date > NOW()
    `,
    [userId]
  );

  res.json({ sent: rows });
});

/**
 * ✅ GET — Credits SHARED TO ME
 */
router.get("/received", apiKeyMiddleware, async (req, res) => {
  const userId = req.user.id;

  const [rows] = await pool.query(
    `
    SELECT
      sc.owner_user_id,
      u.username AS owner_username,
      u.email AS owner_email,
      sc.start_date,
      sc.end_date,
      (
        SELECT COALESCE(SUM(pc.paid_credits), 0)
        FROM purchased_credits pc
        WHERE pc.user_id = sc.owner_user_id
          AND pc.end_date > NOW()
      ) AS owner_remaining_credits
    FROM shared_credits sc
    JOIN users u ON u.id = sc.owner_user_id
    WHERE sc.shared_user_id = ?
      AND sc.end_date > NOW()
    `,
    [userId]
  );

  res.json({ received: rows });
});

/**
 * ✅ POST — Share credits (ACCESS-BASED)
 * body: { email }
 */ router.post("/", apiKeyMiddleware, async (req, res) => {
    console.log("SHARE BODY:", req.body); 
  const ownerUserId = req.user.id;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "missing_email" });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // ✅ 1. Owner must have active paid credits
    const [paid] = await conn.query(
      `
      SELECT 1
      FROM purchased_credits
      WHERE user_id = ?
        AND paid_credits > 0
        AND end_date > NOW()
      LIMIT 1
      FOR UPDATE
      `,
      [ownerUserId]
    );

    if (!paid.length) {
      throw new Error("NOT_PAID");
    }

    // ✅ 2. Find recipient by email
    const [users] = await conn.query(`SELECT id FROM users WHERE email = ?`, [
      email,
    ]);

    const sharedUser = users[0];

    console.log("SHARE EMAIL →", JSON.stringify(email));

    if (!sharedUser) {
      throw new Error("USER_NOT_FOUND");
    }

    // ✅ 3. Insert share
    await conn.query(
      `
      INSERT INTO shared_credits
      (id, owner_user_id, shared_user_id, start_date, end_date)
      VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH))
      `,
      [crypto.randomUUID(), ownerUserId, sharedUser.id]
    );

    // ✅ 4. Audit logs only
    await conn.query(
      `
      INSERT INTO transactions
      (id, user_id, type, amount, credit_source, meta)
      VALUES (?, ?, 'share_out', 0, 'paid', ?)
      `,
      [
        crypto.randomUUID(),
        ownerUserId,
        JSON.stringify({ shared_to: sharedUser.id }),
      ]
    );

    await conn.query(
      `
      INSERT INTO transactions
      (id, user_id, type, amount, credit_source, meta)
      VALUES (?, ?, 'share_in', 0, 'shared', ?)
      `,
      [
        crypto.randomUUID(),
        sharedUser.id,
        JSON.stringify({ shared_from: ownerUserId }),
      ]
    );

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("SHARE ERROR 👉", err.message, err.code);

    if (err.message === "NOT_PAID") {
      return res.status(403).json({ message: "upgrade_required" });
    }

    if (err.message === "USER_NOT_FOUND") {
      return res.status(404).json({ message: "user_not_found" });
    }

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "already_shared" });
    }

    return res.status(500).json({
      message: "share_failed",
      debug: err.message,
    });
  } finally {
    conn.release();
  }
});

export default router;
