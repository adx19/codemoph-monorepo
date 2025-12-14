import express from "express";
import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { signJwt } from "../auth.js";
import crypto from "crypto";
const MIN_PASSWORD_LENGTH = 6;

const router = express.Router();
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  // 1️⃣ Basic validation
  if (!username || !email || !password) {
    return res.status(400).json({
      message: "missing_fields",
    });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({
      message: "password_too_short",
    });
  }

  try {
    // 2️⃣ Check if email already exists
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "email_already_exists",
      });
    }

    // 3️⃣ Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const userId = crypto.randomUUID();
    const authId = crypto.randomUUID();

    // 4️⃣ Insert user
    await pool.query(
      `
        INSERT INTO users (id, username, email, credits, is_paid)
        VALUES (?, ?, ?, ?, ?)
      `,
      [userId, username, email, 25, 0]
    );

    // 5️⃣ Insert auth provider
    await pool.query(
      `
        INSERT INTO user_auth_providers
        (id, user_id, provider, provider_user_id, password_hash)
        VALUES (?, ?, 'local', ?, ?)
      `,
      [authId, userId, email, passwordHash]
    );

    // 6️⃣ Issue token
    const token = signJwt({ id: userId, email, username });

    res.json({
      message: "signup_success",
      token,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({
      message: "signup_failed",
    });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await pool.query(
    `SELECT
       u.id,
       u.username,
       u.email,
       u.credits,
       p.password_hash
     FROM users u
     JOIN user_auth_providers p ON p.user_id = u.id
     WHERE u.email = ?
       AND p.provider = 'local'`,
    [email]
  );

  if (!rows.length) {
    return res.status(401).json({ message: "invalid_credentials" });
  }

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);

  if (!ok) {
    return res.status(401).json({ message: "invalid_credentials" });
  }

  const token = signJwt({
    id: user.id,
    email: user.email,
    username: user.username,
  });

  res.json({
    message: "login_success",
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      credits: user.credits,
    },
  });
});
async function findOrCreateOAuthUser({
  provider,
  providerUserId,
  email,
  username,
}) {
  // 1️⃣ Try to find existing auth provider
  const [authRows] = await pool.query(
    `
      SELECT u.id, u.username, u.email
      FROM user_auth_providers p
      JOIN users u ON u.id = p.user_id
      WHERE p.provider = ? AND p.provider_user_id = ?
    `,
    [provider, providerUserId]
  );

  if (authRows.length) {
    return authRows[0];
  }

  // 2️⃣ If not found, maybe user exists by email (local or other provider)
  const [userRows] = await pool.query(
    `SELECT id, username, email FROM users WHERE email = ?`,
    [email]
  );

  let userId;
  let finalUsername;

  if (userRows.length) {
    userId = userRows[0].id;
    finalUsername = userRows[0].username;
  } else {
    // 3️⃣ Create new user
    userId = crypto.randomUUID();
    finalUsername = username || email.split("@")[0];

    await pool.query(
      `
        INSERT INTO users (id, username, email, credits, is_paid)
        VALUES (?, ?, ?, ?, ?)
      `,
      [userId, finalUsername, email, 25, 0]
    );
  }

  // 4️⃣ Link in user_auth_providers
  const authId = crypto.randomUUID();
  await pool.query(
    `
      INSERT INTO user_auth_providers
      (id, user_id, provider, provider_user_id)
      VALUES (?, ?, ?, ?)
    `,
    [authId, userId, provider, providerUserId]
  );

  return { id: userId, username: finalUsername, email };
}
// 🌐 GOOGLE OAUTH

router.get("/google/start", (req, res) => {
  const redirectUri = encodeURIComponent(
    `${process.env.BACKEND_URL || "http://localhost:5000"}/auth/google/callback`
  );

  const scope = encodeURIComponent("openid email profile");

  const url =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&access_type=offline` +
    `&prompt=select_account`;

  res.redirect(url);
});

router.get("/google/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Missing code");
  }

  const redirectUri = `${
    process.env.BACKEND_URL || "http://localhost:5000"
  }/auth/google/callback`;

  try {
    // 1️⃣ Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenJson = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("Google token error", tokenJson);
      return res.status(400).send("Google auth failed");
    }

    const { id_token, access_token } = tokenJson;

    // 2️⃣ Fetch profile
    const profileRes = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const profile = await profileRes.json();

    const providerUserId = profile.sub;
    const email = profile.email;
    const username = profile.name || profile.given_name || email.split("@")[0];

    const user = await findOrCreateOAuthUser({
      provider: "google",
      providerUserId,
      email,
      username,
    });

    const token = signJwt({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(
      `${frontendUrl}/oauth/callback?token=${encodeURIComponent(token)}`
    );
  } catch (err) {
    console.error("Google callback error", err);
    res.status(500).send("Google auth failed");
  }
});
// 🌐 GITHUB OAUTH

router.get("/github/start", (req, res) => {
  const redirectUri = encodeURIComponent(
    `${process.env.BACKEND_URL || "http://localhost:5000"}/auth/github/callback`
  );

  const url =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${process.env.GITHUB_CLIENT_ID}` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${encodeURIComponent("read:user user:email")}`;

  res.redirect(url);
});

router.get("/github/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Missing code");
  }

  const redirectUri = `${
    process.env.BACKEND_URL || "http://localhost:5000"
  }/auth/github/callback`;

  try {
    // 1️⃣ Exchange code for access token
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
        }),
      }
    );

    const tokenJson = await tokenRes.json();

    if (!tokenRes.ok || !tokenJson.access_token) {
      console.error("GitHub token error", tokenJson);
      return res.status(400).send("GitHub auth failed");
    }

    const accessToken = tokenJson.access_token;

    // 2️⃣ Fetch profile
    const profileRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await profileRes.json();

    // 3️⃣ Fetch primary email
    const emailRes = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const emails = await emailRes.json();
    const primaryEmail =
      emails.find((e) => e.primary && e.verified)?.email || emails[0]?.email;

    if (!primaryEmail) {
      return res.status(400).send("GitHub email not available");
    }

    const providerUserId = String(profile.id);
    const email = primaryEmail;
    const username = profile.name || profile.login || email.split("@")[0];

    const user = await findOrCreateOAuthUser({
      provider: "github",
      providerUserId,
      email,
      username,
    });

    const token = signJwt({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(
      `${frontendUrl}/oauth/callback?token=${encodeURIComponent(token)}`
    );
  } catch (err) {
    console.error("GitHub callback error", err);
    res.status(500).send("GitHub auth failed");
  }
});

export default router;
