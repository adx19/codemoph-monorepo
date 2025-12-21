import express from "express";
import axios from "axios";
import crypto from "crypto";
import { pool } from "../../db.js";
import { signJwt } from "../../auth.js";

const router = express.Router();

router.get("/google", (req, res) => {
  const redirect = `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT,
      response_type: "code",
      scope: "openid email profile",
    });

  res.redirect(redirect);
});

router.get("/google/callback", async (req, res) => {
  const { code } = req.query;

  // 1️⃣ Exchange code for token
  const tokenRes = await axios.post(
    "https://oauth2.googleapis.com/token",
    {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT,
    }
  );

  const { access_token } = tokenRes.data;

  // 2️⃣ Fetch Google profile
  const userRes = await axios.get(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  const { email, name, id: googleId } = userRes.data;

  // 3️⃣ Find or create user
  let userId;

  const [[existing]] = await pool.query(
    `
    SELECT u.id
    FROM users u
    JOIN user_auth_providers p
      ON p.user_id = u.id
    WHERE p.provider = 'google'
      AND p.provider_user_id = ?
    `,
    [googleId]
  );

  if (existing) {
    userId = existing.id;
  } else {
    userId = crypto.randomUUID();

    await pool.query(
      `INSERT INTO users (id, username, email, credits, is_paid)
       VALUES (?, ?, ?, 25, 0)`,
      [userId, name, email]
    );

    await pool.query(
      `INSERT INTO user_auth_providers
        (id, user_id, provider, provider_user_id)
       VALUES (?, ?, 'google', ?)`,
      [crypto.randomUUID(), userId, googleId]
    );
  }

  // 4️⃣ Sign YOUR JWT
  const token = signJwt({ id: userId, email });

  // 5️⃣ Redirect to frontend
  res.redirect(
    `http://www.codemorph.me/oauth/callback?token=${token}`
  );
});

export default router;
