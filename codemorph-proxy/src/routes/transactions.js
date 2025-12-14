import express from "express";
import { pool } from "../db.js";
import { apiKeyMiddleware } from "../auth.js";

const router = express.Router();

router.get("/", apiKeyMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, type, search } = req.query;

  const offset = (page - 1) * limit;

  let where = "WHERE user_id = ?";
  const params = [userId];

  // Type filter
  if (type && type !== "all") {
    where += " AND type = ?";
    params.push(type);
  }

  // 🔍 SEARCH (type, credit_source, amount, date)
  if (search && search.trim()) {
    where += `
      AND (
        LOWER(type) LIKE ?
        OR LOWER(credit_source) LIKE ?
        OR CAST(amount AS CHAR) LIKE ?
        OR DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') LIKE ?
      )
    `;
    const q = `%${search.toLowerCase()}%`;
    params.push(q, q, q, q);
  }

  const [rows] = await pool.query(
    `
    SELECT
      id,
      type,
      amount,
      credit_source,
      meta,
      created_at
    FROM transactions
    ${where}
    ORDER BY created_at DESC
    LIMIT ?
    OFFSET ?
    `,
    [...params, Number(limit), Number(offset)]
  );

  const [[{ total }]] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM transactions
    ${where}
    `,
    params
  );

  res.json({
    data: rows,
    page: Number(page),
    total,
  });
});


export default router;
