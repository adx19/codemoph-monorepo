import express from "express";
import axios from "axios";
import crypto from "crypto";
import { pool } from "../../db.js";
import { signJwt } from "../../auth.js";

const router = express.Router();

router.get("/google", (req, res) => {
  const redirect =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });

  res.redirect(redirect);
});

router.get("/google/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    console.error("GOOGLE CALLBACK HIT WITHOUT CODE");
    return res.status(400).send("Missing code from Google OAuth");
  }
  // 1️⃣ Exchange code for token
  let tokenRes;
  try {
    tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT,
      },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("GOOGLE TOKEN ERROR →", err.response?.data || err.message);
    return res.status(500).send("Google OAuth token exchange failed");
  }

  const { access_token } = tokenRes.data;

  // 2️⃣ Fetch Google profile
  const userRes = await axios.get(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  const { email, name, id: googleId } = userRes.data;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 3️⃣ Find existing user via google provider
    const existingRes = await client.query(
      `
      SELECT u.id
      FROM users u
      JOIN user_auth_providers p
        ON p.user_id = u.id
      WHERE p.provider = 'google'
        AND p.provider_user_id = $1
      `,
      [googleId]
    );

    let userId;

    if (existingRes.rows.length) {
      userId = existingRes.rows[0].id;
    } else {
      userId = crypto.randomUUID();

      // Create user
      await client.query(
        `
        INSERT INTO users (id, username, email, credits, is_paid)
        VALUES ($1, $2, $3, 25, false)
        `,
        [userId, name, email]
      );

      // Create auth provider
      await client.query(
        `
        INSERT INTO user_auth_providers
        (id, user_id, provider, provider_user_id)
        VALUES ($1, $2, 'google', $3)
        `,
        [crypto.randomUUID(), userId, googleId]
      );
    }

    await client.query("COMMIT");

    // 4️⃣ Issue JWT
    const token = signJwt({ id: userId, email });

    // 5️⃣ Redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL}/oauth/callback?token=${token}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("GOOGLE OAUTH ERROR:", err);
    res.redirect(
      `${process.env.FRONTEND_URL}/oauth/callback?error=oauth_failed`
    );
  } finally {
    client.release();
  }
});

export default router;
