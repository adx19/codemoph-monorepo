import express from "express";
import { pool } from "../db.js";
import { apiKeyMiddleware } from "../auth.js";

const router = express.Router();

router.get("/", apiKeyMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, type, search } = req.query;

  const offset = (page - 1) * limit;
  let idx = 1;

  let where = `WHERE user_id = $${idx++}`;
  const params = [userId];

  if (type && type !== "all") {
    where += ` AND type = $${idx++}`;
    params.push(type);
  }

  if (search && search.trim()) {
    where += `
      AND (
        LOWER(type) LIKE $${idx}
        OR LOWER(credit_source) LIKE $${idx}
        OR amount::text LIKE $${idx}
        OR to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') LIKE $${idx}
      )
    `;
    params.push(`%${search.toLowerCase()}%`);
    idx++;
  }

  const { rows } = await pool.query(
    `
    SELECT id, type, amount, credit_source, meta, created_at
    FROM transactions
    ${where}
    ORDER BY created_at DESC
    LIMIT $${idx++}
    OFFSET $${idx++}
    `,
    [...params, Number(limit), Number(offset)]
  );

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM transactions ${where}`,
    params
  );

  res.json({
    data: rows,
    page: Number(page),
    total: Number(countRes.rows[0].count),
  });
});

export default router;
