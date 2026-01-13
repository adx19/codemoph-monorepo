import express from "express";
import { pool } from "../db.js";
import { generateResponse } from "../utils/huggingface.js";
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

  const result = await pool.query(
    `
    SELECT COUNT(*)::int AS active
    FROM purchased_credits
    WHERE user_id = $1
      AND paid_credits > 0
      AND end_date >= NOW()
    `,
    [userId]
  );

  const active = result.rows[0]?.active ?? 0;
  const isPaidUser = active > 0;

  if (!isPaidUser) {
    if (
      !FREE_LANGUAGES.includes(fromLang) ||
      !FREE_LANGUAGES.includes(toLang)
    ) {
      return res.status(403).json({ message: "upgrade_required" });
    }
  }

  let reply;

  try {
    reply = await generateResponse(prompt);

    if (!reply) {
      throw new Error("EMPTY_REPLY");
    }
  } catch (err) {
    console.error("AI error → Credits NOT deducted:", err);
    return res.status(500).json({
      message: "convert_failed",
      debug: err.message || String(err),
    });
  }

  const conn = await pool.connect();

  try {
    await conn.query("BEGIN");

    const paid = await conn.query(
      `
      SELECT id, paid_credits
      FROM purchased_credits
      WHERE user_id = $1
        AND paid_credits > 0
        AND end_date > NOW()
      ORDER BY end_date ASC
      LIMIT 1
      FOR UPDATE
      `,
      [userId]
    );

    const paidRows = paid.rows;

    if (paidRows.length > 0) {
      await conn.query(
        `UPDATE purchased_credits SET paid_credits = paid_credits - 1 WHERE id = $1`,
        [paidRows[0].id]
      );

      await conn.query(
        `INSERT INTO transactions
         (id, user_id, type, amount, credit_source, meta)
         VALUES ($1, $2, 'usage', -1, 'paid', $3)`,
        [crypto.randomUUID(), userId, JSON.stringify({ from: "convert" })]
      );
    } else {
      const share = await conn.query(
        `
        SELECT pc.id AS purchased_credit_id, sc.owner_user_id
        FROM shared_credits sc
        JOIN purchased_credits pc ON pc.user_id = sc.owner_user_id
        WHERE sc.shared_user_id = $1
          AND sc.end_date > NOW()
          AND pc.paid_credits > 0
          AND pc.end_date > NOW()
        ORDER BY pc.end_date ASC
        LIMIT 1
        FOR UPDATE
        `,
        [userId]
      );

      const sharedRows = share.rows;

      if (sharedRows.length > 0) {
        await conn.query(
          `UPDATE purchased_credits SET paid_credits = paid_credits - 1 WHERE id = $1`,
          [sharedRows[0].purchased_credit_id]
        );

        await conn.query(
          `INSERT INTO transactions
           (id, user_id, type, amount, credit_source, meta)
           VALUES ($1, $2, 'usage', -1, 'shared', $3)`,
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
        const user_rows = await conn.query(
          `SELECT credits FROM users WHERE id = $1 FOR UPDATE`,
          [userId]
        );

        const userRows = user_rows.rows;

        if (!userRows.length || userRows[0].credits <= 0) {
          throw new Error("NO_CREDITS");
        }

        await conn.query(
          `UPDATE users SET credits = credits - 1 WHERE id = $1`,
          [userId]
        );

        await conn.query(
          `INSERT INTO transactions
           (id, user_id, type, amount, credit_source, meta)
           VALUES ($1, $2, 'usage', -1, 'free', $3)`,
          [crypto.randomUUID(), userId, JSON.stringify({ from: "convert" })]
        );
      }
    }

    await conn.query("COMMIT");
    conn.release();

    return res.json({ reply });
  } catch (err) {
    await conn.query("ROLLBACK");
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