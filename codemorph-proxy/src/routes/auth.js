import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { pool } from "../db.js";
import { signJwt } from "../auth.js";
import { Resend } from "resend";

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

const MIN_PASSWORD_LENGTH = 6;

router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "missing_fields" });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ message: "password_too_short" });
  }

  // block if already registered
  const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [
    email,
  ]);

  if (existing.length) {
    return res.status(409).json({ message: "email_already_exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date();
  expires.setDate(expires.getDate() + 1);

  await pool.query(
    `
    INSERT INTO email_verifications
    (id, email, username, password_hash, token, expires)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [crypto.randomUUID(), email, username, passwordHash, token, expires]
  );

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  console.log("📧 Sending verification email to:", email);
  console.log("🔗 Verify URL:", verifyUrl);

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Verify your CodeMorph account",
    html: `
    <h2>Welcome to CodeMorph</h2>
    <p>Please verify your email to activate your account.</p>
    <a href="${verifyUrl}">Verify Email</a>
    <p>This link expires in 24 hours.</p>
  `,
  });

  res.json({ message: "verification_email_sent" });
});

router.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  if (!token) return res.status(400).send("Invalid token");

  const [rows] = await pool.query(
    `
    SELECT * FROM email_verifications
    WHERE token = ?
      AND expires >= CURDATE()
    `,
    [token]
  );

  if (!rows.length) {
    return res.status(400).send("Invalid or expired token");
  }

  const record = rows[0];

  const userId = crypto.randomUUID();
  const authId = crypto.randomUUID();

  await pool.query(
    `
    INSERT INTO users (id, username, email, credits, is_paid, is_email_verified)
    VALUES (?, ?, ?, ?, ?, 1)
    `,
    [userId, record.username, record.email, 25, 0]
  );

  await pool.query(
    `
    INSERT INTO user_auth_providers
    (id, user_id, provider, provider_user_id, password_hash)
    VALUES (?, ?, 'local', ?, ?)
    `,
    [authId, userId, record.email, record.password_hash]
  );

  // cleanup
  await pool.query("DELETE FROM email_verifications WHERE id = ?", [record.id]);

  res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
});

// =====================
// 🔐 LOGIN
// =====================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await pool.query(
    `
    SELECT u.id, u.username, u.email, u.credits, u.is_email_verified, p.password_hash
    FROM users u
    JOIN user_auth_providers p ON p.user_id = u.id
    WHERE u.email = ? AND p.provider = 'local'
    `,
    [email]
  );

  if (!rows.length) {
    return res.status(401).json({ message: "invalid_credentials" });
  }

  const user = rows[0];

  if (!user.is_email_verified) {
    return res.status(403).json({ message: "email_not_verified" });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ message: "invalid_credentials" });
  }

  const token = signJwt({
    id: user.id,
    email: user.email,
    username: user.username,
  });

  res.json({ message: "login_success", token });
});

export default router;
