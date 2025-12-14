import express from "express";
import { pool } from "../db.js";
import { generateResponse } from "../utils/gemini.js";
import { apiKeyMiddleware } from "../auth.js";
import crypto from "crypto";

const router = express.Router();

const FREE_LANGUAGES = [
  "python",
  "java",
  "javascript",
  "cpp",
  "c",
  "typescript",
];

router.post("/", apiKeyMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { prompt, fromLang, toLang } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: "missing_prompt" });
  }

  if (!fromLang || !toLang) {
    return res.status(400).json({ message: "missing_language_info" });
  }

  // Check if user has paid credits (pre-validation only)
  const [[{ active }]] = await pool.query(
    `
    SELECT COUNT(*) AS active
    FROM purchased_credits
    WHERE user_id = ?
      AND paid_credits > 0
      AND end_date >= NOW()
    `,
    [userId]
  );

  const isPaidUser = active > 0;

  // FREE TIER check
  if (!isPaidUser) {
    if (!FREE_LANGUAGES.includes(fromLang) || !FREE_LANGUAGES.includes(toLang)) {
      return res.status(403).json({ message: "upgrade_required" });
    }
  }

  let reply;

  try {
    // 1️⃣ Try Gemini FIRST — do NOT reduce credits yet
    reply = await generateResponse(prompt);

    if (!reply) {
      throw new Error("EMPTY_REPLY");
    }
  } catch (err) {
    console.error("Gemini error → Credits NOT deducted:", err);
    return res.status(500).json({
      message: "convert_failed",
      debug: err.message || String(err),
    });
  }

  // 2️⃣ Credits MUST be deducted ONLY after successful reply
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Try paid credits
    const [paidRows] = await conn.query(
      `
      SELECT id, paid_credits
      FROM purchased_credits
      WHERE user_id = ?
        AND paid_credits > 0
        AND end_date > NOW()
      ORDER BY end_date ASC
      LIMIT 1
      FOR UPDATE
      `,
      [userId]
    );

    if (paidRows.length > 0) {
      // Deduct paid credits
      await conn.query(
        `UPDATE purchased_credits SET paid_credits = paid_credits - 1 WHERE id = ?`,
        [paidRows[0].id]
      );

      await conn.query(
        `INSERT INTO transactions
         (id, user_id, type, amount, credit_source, meta)
         VALUES (?, ?, 'usage', -1, 'paid', ?)`,
        [crypto.randomUUID(), userId, JSON.stringify({ from: "convert" })]
      );
    } else {
      // Shared credits fallback
      const [sharedRows] = await conn.query(
        `
        SELECT pc.id AS purchased_credit_id, sc.owner_user_id
        FROM shared_credits sc
        JOIN purchased_credits pc ON pc.user_id = sc.owner_user_id
        WHERE sc.shared_user_id = ?
          AND sc.end_date > NOW()
          AND pc.paid_credits > 0
          AND pc.end_date > NOW()
        ORDER BY pc.end_date ASC
        LIMIT 1
        FOR UPDATE
        `,
        [userId]
      );

      if (sharedRows.length > 0) {
        // Deduct shared credit
        await conn.query(
          `UPDATE purchased_credits SET paid_credits = paid_credits - 1 WHERE id = ?`,
          [sharedRows[0].purchased_credit_id]
        );

        await conn.query(
          `INSERT INTO transactions
           (id, user_id, type, amount, credit_source, meta)
           VALUES (?, ?, 'usage', -1, 'shared', ?)`,
          [
            crypto.randomUUID(),
            userId,
            JSON.stringify({
              owner: sharedRows[0].owner_user_id,
              from: "convert",
            }),
          ]
        );
      } else {
        // Free credits fallback
        const [userRows] = await conn.query(
          `SELECT credits FROM users WHERE id = ? FOR UPDATE`,
          [userId]
        );

        if (!userRows.length || userRows[0].credits <= 0) {
          throw new Error("NO_CREDITS");
        }

        await conn.query(
          `UPDATE users SET credits = credits - 1 WHERE id = ?`,
          [userId]
        );

        await conn.query(
          `INSERT INTO transactions
           (id, user_id, type, amount, credit_source, meta)
           VALUES (?, ?, 'usage', -1, 'free', ?)`,
          [crypto.randomUUID(), userId, JSON.stringify({ from: "convert" })]
        );
      }
    }

    await conn.commit();
    conn.release();

    return res.json({ reply });

  } catch (err) {
    await conn.rollback();
    conn.release();

    if (err.message === "NO_CREDITS") {
      return res.status(402).json({ message: "insufficient_credits" });
    }

    console.error("Credit deduction error:", err);

    return res.status(500).json({
      message: "convert_failed_after_successful_ai",
      debug: err.message || String(err),
    });
  }
});

export default router;
