import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { pool } from "../db.js";
import { signJwt } from "../auth.js";
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
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existing.length) {
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
  VALUES (?, ?, ?, ?, ?, ?)
  `,
      [
        verificationId,
        email,
        username,
        passwordHash,
        token,
        expires.toISOString().split("T")[0], // DATE only
      ]
    );

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

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

    console.log(email);

    res.json({ message: "verification_email_sent" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "signup_failed" });
  }
});
router.get("/verify-email", async (req, res) => {
  console.log("VERIFY EMAIL CALLED -> ", req.query)
  const { token } = req.query;

  if (!token) {
    return res.status(400).send("Invalid verification link");
  }

  try {
    // 1️⃣ Get verification record
    const [rows] = await pool.query(
      `
      SELECT *
      FROM email_verifications
      WHERE token = ?
        AND expires >= CURDATE()
      `,
      [token]
    );

    if (!rows.length) {
      return res.status(400).send("Verification link expired or invalid");
    }

    const record = rows[0];

    const userId = crypto.randomUUID();
    const authId = crypto.randomUUID();

    // 2️⃣ Create user
    await pool.query(
      `
      INSERT INTO users
      (id, username, email, credits, is_paid, is_email_verified)
      VALUES (?, ?, ?, 25, 0, 1)
      `,
      [userId, record.username, record.email]
    );

    // 3️⃣ Create auth provider
    await pool.query(
      `
      INSERT INTO user_auth_providers
      (id, user_id, provider, provider_user_id, password_hash)
      VALUES (?, ?, 'local', ?, ?)
      `,
      [
        authId,
        userId,
        record.email,
        record.password_hash
      ]
    );

    // 4️⃣ Delete verification record
    await pool.query(
      "DELETE FROM email_verifications WHERE id = ?",
      [record.id]
    );

    // 5️⃣ Redirect to frontend login
    res.redirect(
      `${process.env.FRONTEND_URL}/login?verified=true`
    );
  } catch (err) {
    console.error("Verify email error:", err);
    res.status(500).send("Email verification failed");
  }
});

/* ======================
   LOGIN
====================== */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await pool.query(
    `
    SELECT u.id, u.username, u.email, p.password_hash
    FROM users u
    JOIN user_auth_providers p ON p.user_id = u.id
    WHERE u.email = ? AND p.provider = 'local'
    `,
    [email]
  );

  if (!rows.length) {
    return res.status(401).json({ message: "invalid_credentials" });
  }

  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) {
    return res.status(401).json({ message: "invalid_credentials" });
  }

  const token = signJwt({
    id: rows[0].id,
    email: rows[0].email,
    username: rows[0].username,
  });

  res.json({ message: "login_success", token });
});

export default router;
