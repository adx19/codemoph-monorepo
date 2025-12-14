// routes/dashboard.js  (replace the summary route implementation)
import express from "express";
import { pool } from "../db.js";
import { apiKeyMiddleware } from "../auth.js";

const router = express.Router();

router.get("/summary", apiKeyMiddleware, async (req, res) => {
  const userId = req.user.id;

  const conn = await pool.getConnection();

  try {
    // We read free credits under a short transaction to ensure a consistent read
    await conn.beginTransaction();
    const [[freeRow]] = await conn.query(
      `SELECT credits FROM users WHERE id = ? FOR UPDATE`,
      [userId]
    );
    await conn.commit();

    const freeCredits = Number(freeRow?.credits || 0);

    // Paid remaining: read the current remaining paid_credits (single source of truth)
    const [[paidRow]] = await pool.query(
      `
      SELECT COALESCE(SUM(paid_credits), 0) AS total_paid,
             MAX(plan_type) AS plan,
             MAX(end_date) AS subscriptionEndsAt
      FROM purchased_credits
      WHERE user_id = ?
        AND end_date > NOW()
      `,
      [userId]
    );

    const paidRemaining = Number(paidRow?.total_paid || 0);
    const subscriptionEndsAt = paidRow?.subscriptionEndsAt ? new Date(paidRow.subscriptionEndsAt) : null;
    const plan = paidRow?.plan || null;

    // Calculate how many of the paid credits the user has already *consumed* (positive number)
    const [[paidUsedRow]] = await pool.query(
      `
      SELECT COALESCE(ABS(SUM(amount)), 0) AS used_paid
      FROM transactions
      WHERE user_id = ?
        AND type = 'usage'
        AND credit_source = 'paid'
      `,
      [userId]
    );

    // Note: paidRemaining is authoritative. We still expose paidUsed for debugging/visibility.
    const paidUsed = Number(paidUsedRow?.used_paid || 0);

    // Shared credits: find owners who shared with this user and compute how much is still available to the recipient
    const [owners] = await pool.query(
      `
      SELECT DISTINCT owner_user_id
      FROM shared_credits
      WHERE shared_user_id = ?
        AND end_date > NOW()
      `,
      [userId]
    );

    let sharedRemaining = 0;

    for (const row of owners) {
      const ownerId = row.owner_user_id;

      // Owner's current remaining paid credits (authoritative)
      const [[ownerTotalPaidRow]] = await pool.query(
        `
        SELECT COALESCE(SUM(paid_credits), 0) AS total_paid
        FROM purchased_credits
        WHERE user_id = ?
          AND end_date > NOW()
        `,
        [ownerId]
      );

      const ownerTotalPaid = Number(ownerTotalPaidRow?.total_paid || 0);

      // How many paid credits the owner has consumed (positive)
      const [[ownerUsedRow]] = await pool.query(
        `
        SELECT COALESCE(ABS(SUM(amount)), 0) AS used_paid
        FROM transactions
        WHERE user_id = ?
          AND type = 'usage'
          AND credit_source = 'paid'
        `,
        [ownerId]
      );

      const ownerUsed = Number(ownerUsedRow?.used_paid || 0);

      // How many shared credits (from this owner) the recipient (current user) has consumed (positive)
      const [[sharedUsedByRecipientRow]] = await pool.query(
        `
        SELECT COALESCE(ABS(SUM(amount)), 0) AS used_shared
        FROM transactions
        WHERE user_id = ?
          AND type = 'usage'
          AND credit_source = 'shared'
          AND JSON_EXTRACT(meta, '$.owner') = ?
        `,
        [userId, ownerId]
      );

      const sharedUsedByRecipient = Number(sharedUsedByRecipientRow?.used_shared || 0);

      // Owner remaining = owner's currently available paid credits minus owner's own used (ownerTotalPaid - ownerUsed)
      // However ownerTotalPaid already reflects remaining paid_credits; ownerUsed is historical usage.
      // To avoid double-counting, treat ownerRemaining conservatively:
      // ownerRemaining = ownerTotalPaid - sharedUsedByRecipient
      const ownerRemaining = Math.max(0, ownerTotalPaid - sharedUsedByRecipient);

      sharedRemaining += ownerRemaining;
    }

    // Used today: positive number
    const [[usedTodayRow]] = await pool.query(
      `
      SELECT COALESCE(ABS(SUM(amount)), 0) AS usedToday
      FROM transactions
      WHERE user_id = ?
        AND type = 'usage'
        AND DATE(created_at) = CURDATE()
      `,
      [userId]
    );

    const usedToday = Number(usedTodayRow?.usedToday || 0);

    // Shared out and received counts
    const [[sharedOutRow]] = await pool.query(
      `
      SELECT COUNT(*) AS sharedOut
      FROM shared_credits
      WHERE owner_user_id = ?
        AND end_date > NOW()
      `,
      [userId]
    );

    const [[receivedRow]] = await pool.query(
      `
      SELECT COUNT(*) AS received
      FROM shared_credits
      WHERE shared_user_id = ?
        AND end_date > NOW()
      `,
      [userId]
    );

    const sharedOut = Number(sharedOutRow?.sharedOut || 0);
    const received = Number(receivedRow?.received || 0);

    const [recentActivity] = await pool.query(
      `
      SELECT type, amount, credit_source, created_at
      FROM transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
      `,
      [userId]
    );

    // Final available credits calculation:
    // freeCredits (from users.credits) + authoritative paidRemaining + sharedRemaining
    const availableCredits = freeCredits + paidRemaining + sharedRemaining;

    // Compute daysLeft (integer) based on subscriptionEndsAt if present
    let daysLeft = null;
    if (subscriptionEndsAt) {
      const diffMs = subscriptionEndsAt.getTime() - Date.now();
      daysLeft = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
    }

    res.json({
      freeCredits,
      paidCredits: paidRemaining,
      sharedCredits: sharedRemaining,
      availableCredits,
      usedToday,
      sharedOut,
      received,
      plan,
      subscriptionEndsAt: subscriptionEndsAt ? subscriptionEndsAt.toISOString() : null,
      daysLeft,
      recentActivity,
      // optional debugging fields:
      _debug: { paidUsed, freeCreditsFromUsers: freeCredits },
    });
  } catch (err) {
    console.error("Error in /dashboard/summary:", err);
    try {
      await conn.rollback();
    } catch {}
    conn.release();
    res.status(500).json({ message: "summary_failed", debug: err.message || String(err) });
    return;
  } finally {
    // ensure release if not already
    try {
      conn.release();
    } catch {}
  }
});

export default router;
