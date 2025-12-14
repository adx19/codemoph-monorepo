import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { pool } from "../db.js";
import { signJwt } from "../auth.js";
import { Resend } from "resend";

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);
const MIN_PASSWORD_LENGTH = 6;

// =====================
// 🧾 SIGNUP (NO USER CREATED YET)
// =====================
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "missing_fields" });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ message: "password_too_short" });
  }

  try {
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length) {
      return res.status(409).json({ message: "email_already_exists" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setDate(expires.getDate() + 1);

    // 👉 ONLY store verification request
    await pool.query(
      `
      INSERT INTO email_verifications (email, username, password_hash, token, expires_at)
      VALUES (?, ?, ?, ?, ?)
      `,
      [email, username, await bcrypt.hash(password, 10), token, expires]
    );

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    console.log("📧 Sending verification email to:", email);

    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Verify your CodeMorph account",
      html: `
        <h2>Welcome to CodeMorph</h2>
        <p>Click the button below to verify your email.</p>
        <a href="${verifyUrl}">Verify Email</a>
        <p>This link expires in 24 hours.</p>
      `,
    });

    res.json({ message: "verification_email_sent" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "signup_failed" });
  }
});

// =====================
// ✅ VERIFY EMAIL → CREATE USER
// =====================
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  const [rows] = await pool.query(
    `
    SELECT * FROM email_verifications
    WHERE token = ? AND expires_at >= CURDATE()
    `,
    [token]
  );

  if (!rows.length) {
    return res.status(400).send("Invalid or expired token");
  }

  const v = rows[0];
  const userId = crypto.randomUUID();

  await pool.query(
    `
    INSERT INTO users (id, username, email, credits, is_paid, is_email_verified)
    VALUES (?, ?, ?, 25, 0, 1)
    `,
    [userId, v.username, v.email]
  );

  await pool.query(
    `
    INSERT INTO user_auth_providers
    (id, user_id, provider, provider_user_id, password_hash)
    VALUES (?, ?, 'local', ?, ?)
    `,
    [crypto.randomUUID(), userId, v.email, v.password_hash]
  );

  await pool.query(
    "DELETE FROM email_verifications WHERE id = ?",
    [v.id]
  );

  res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
});

export default router;
