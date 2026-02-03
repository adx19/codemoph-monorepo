import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { pool } from "../db.js";
import { apiKeyMiddleware, signJwt } from "../auth.js";
import { Resend } from "resend";

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

const MIN_PASSWORD_LENGTH = 6;

/* ======================
   SIGNUP (NO USER CREATED)
====================== */
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "missing_fields" });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ message: "password_too_short" });
  }

  try {
    // Check if already verified user exists
    const existingResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingResult.rows.length) {
      return res.status(409).json({ message: "email_already_exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationId = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString("hex");

    const expires = new Date();
    expires.setDate(expires.getDate() + 1);

    await pool.query(
      `
      INSERT INTO email_verifications
      (id, email, username, password_hash, token, expires)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        verificationId,
        email,
        username,
        passwordHash,
        token,
        expires,
      ]
    );

    const verifyUrl = `${process.env.BACKEND_URL}/auth/verify-email?token=${token}`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Verify your CodeMorph account",
      html: `
        <h2>Welcome to CodeMorph</h2>
        <p>Click below to verify your email:</p>
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

router.get("/me", apiKeyMiddleware, async (req, res) => {
  res.json({
    name: req.user.name,
    email: req.user.email,
    id: req.user.id
  });
});


/* ======================
   VERIFY EMAIL
====================== */
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/verify-email?status=invalid`
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Fetch verification record
    const verifyResult = await client.query(
      `
      SELECT *
      FROM email_verifications
      WHERE token = $1
        AND expires >= CURRENT_DATE
      `,
      [token]
    );

    if (!verifyResult.rows.length) {
      await client.query("ROLLBACK");
      return res.redirect(
        `${process.env.FRONTEND_URL}/verify-email?status=expired`
      );
    }

    const record = verifyResult.rows[0];

    const userId = crypto.randomUUID();
    const authId = crypto.randomUUID();

    // 2️⃣ Create user
    await client.query(
      `
      INSERT INTO users
      (id, username, email, credits, is_paid, is_email_verified)
      VALUES ($1, $2, $3, 25, false, true)
      `,
      [userId, record.username, record.email]
    );

    // 3️⃣ Create auth provider
    await client.query(
      `
      INSERT INTO user_auth_providers
      (id, user_id, provider, provider_user_id, password_hash)
      VALUES ($1, $2, 'local', $3, $4)
      `,
      [authId, userId, record.email, record.password_hash]
    );

    // 4️⃣ Delete verification record
    await client.query(
      "DELETE FROM email_verifications WHERE id = $1",
      [record.id]
    );

    await client.query("COMMIT");

    // 5️⃣ Issue JWT
    const jwtToken = signJwt({
      id: userId,
      email: record.email,
      username: record.username,
    });

    return res.redirect(
      `${process.env.FRONTEND_URL}/verify-email?status=success&token=${jwtToken}`
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Verify email error:", err);

    return res.redirect(
      `${process.env.FRONTEND_URL}/verify-email?status=error`
    );
  } finally {
    client.release();
  }
});

/* ======================
   LOGIN
====================== */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      `
      SELECT u.id, u.username, u.email, p.password_hash
      FROM users u
      JOIN user_auth_providers p ON p.user_id = u.id
      WHERE u.email = $1
        AND p.provider = 'local'
      `,
      [email]
    );

    if (!result.rows.length) {
      return res.status(401).json({ message: "invalid_credentials" });
    }

    const user = result.rows[0];
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
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "login_failed" });
  }
});

export default router;
