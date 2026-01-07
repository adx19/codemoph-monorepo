import express from "express";
import { pool } from "../db.js";
import { apiKeyMiddleware } from "../auth.js";

const router = express.Router();

router.get("/summary", apiKeyMiddleware, async (req, res) => {
  const userId = req.user.id;
  const conn = await pool.connect();

  try {
    await conn.query("BEGIN");

    // Free credits (locked read)
    const freeRes = await conn.query(
      `SELECT credits FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );
    const freeCredits = Number(freeRes.rows[0]?.credits || 0);

    await conn.query("COMMIT");

    // Paid remaining
    const paidRes = await pool.query(
      `
      SELECT
        COALESCE(SUM(paid_credits), 0) AS total_paid,
        MAX(plan_type) AS plan,
        MAX(end_date) AS subscription_ends_at
      FROM purchased_credits
      WHERE user_id = $1
        AND end_date > NOW()
      `,
      [userId]
    );

    const paidRemaining = Number(paidRes.rows[0]?.total_paid || 0);
    const subscriptionEndsAt = paidRes.rows[0]?.subscription_ends_at
      ? new Date(paidRes.rows[0].subscription_ends_at)
      : null;
    const plan = paidRes.rows[0]?.plan || null;

    // Paid used
    const paidUsedRes = await pool.query(
      `
      SELECT COALESCE(ABS(SUM(amount)), 0) AS used_paid
      FROM transactions
      WHERE user_id = $1
        AND type = 'usage'
        AND credit_source = 'paid'
      `,
      [userId]
    );
    const paidUsed = Number(paidUsedRes.rows[0]?.used_paid || 0);

    // Shared credits
    const ownersRes = await pool.query(
      `
      SELECT DISTINCT owner_user_id
      FROM shared_credits
      WHERE shared_user_id = $1
        AND end_date > NOW()
      `,
      [userId]
    );

    let sharedRemaining = 0;

    for (const { owner_user_id: ownerId } of ownersRes.rows) {
      const ownerPaidRes = await pool.query(
        `
        SELECT COALESCE(SUM(paid_credits), 0) AS total_paid
        FROM purchased_credits
        WHERE user_id = $1
          AND end_date > NOW()
        `,
        [ownerId]
      );

      const ownerTotalPaid = Number(ownerPaidRes.rows[0]?.total_paid || 0);

      const sharedUsedRes = await pool.query(
        `
        SELECT COALESCE(ABS(SUM(amount)), 0) AS used_shared
        FROM transactions
        WHERE user_id = $1
          AND type = 'usage'
          AND credit_source = 'shared'
          AND meta->>'owner' = $2
        `,
        [userId, ownerId]
      );

      const sharedUsed = Number(sharedUsedRes.rows[0]?.used_shared || 0);
      sharedRemaining += Math.max(0, ownerTotalPaid - sharedUsed);
    }

    // Used today
    const usedTodayRes = await pool.query(
      `
      SELECT COALESCE(ABS(SUM(amount)), 0) AS used_today
      FROM transactions
      WHERE user_id = $1
        AND type = 'usage'
        AND created_at::date = CURRENT_DATE
      `,
      [userId]
    );

    const usedToday = Number(usedTodayRes.rows[0]?.used_today || 0);

    // Shared counts
    const sharedOutRes = await pool.query(
      `
      SELECT COUNT(*)::int AS count
      FROM shared_credits
      WHERE owner_user_id = $1
        AND end_date > NOW()
      `,
      [userId]
    );

    const receivedRes = await pool.query(
      `
      SELECT COUNT(*)::int AS count
      FROM shared_credits
      WHERE shared_user_id = $1
        AND end_date > NOW()
      `,
      [userId]
    );

    const recentActivityRes = await pool.query(
      `
      SELECT type, amount, credit_source, created_at
      FROM transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
      `,
      [userId]
    );

    const availableCredits = freeCredits + paidRemaining + sharedRemaining;

    let daysLeft = null;
    if (subscriptionEndsAt) {
      const diffMs = subscriptionEndsAt - Date.now();
      daysLeft = diffMs > 0 ? Math.ceil(diffMs / 86400000) : 0;
    }

    res.json({
      freeCredits,
      paidCredits: paidRemaining,
      sharedCredits: sharedRemaining,
      availableCredits,
      usedToday,
      sharedOut: Number(sharedOutRes.rows[0].count),
      received: Number(receivedRes.rows[0].count),
      plan,
      subscriptionEndsAt: subscriptionEndsAt?.toISOString() || null,
      daysLeft,
      recentActivity: recentActivityRes.rows,
      _debug: { paidUsed },
    });
  } catch (err) {
    console.error("Error in /dashboard/summary:", err);
    try {
      await conn.query("ROLLBACK");
    } catch {}
    res.status(500).json({ message: "summary_failed", error: err.message });
  } finally {
    conn.release();
  }
});

export default router;
