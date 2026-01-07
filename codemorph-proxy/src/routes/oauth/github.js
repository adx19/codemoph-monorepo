import express from "express";
import axios from "axios";
import crypto from "crypto";
import { pool } from "../../db.js";
import { signJwt } from "../../auth.js";

const router = express.Router();

/**
 * STEP 1 — Redirect to GitHub
 */
router.get("/login", (req, res) => {
  const redirectUri = `${process.env.BACKEND_URL}/auth/github/callback`;

  const url =
    `https://github.com/login/oauth/authorize?` +
    `client_id=${process.env.GITHUB_CLIENT_ID}` +
    `&redirect_uri=${redirectUri}` +
    `&scope=user:email`;

  res.redirect(url);
});

/**
 * STEP 2 — GitHub callback
 */
router.get("/callback", async (req, res) => {
  const { code } = req.query;

  const client = await pool.connect();

  try {
    // 1️⃣ Exchange code for access token
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } }
    );

    const githubToken = tokenRes.data.access_token;

    // 2️⃣ Fetch GitHub user + emails
    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${githubToken}` },
    });

    const emailRes = await axios.get("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${githubToken}` },
    });

    const email =
      emailRes.data.find((e) => e.primary && e.verified)?.email ||
      emailRes.data[0]?.email;

    if (!email) {
      throw new Error("NO_EMAIL_FROM_GITHUB");
    }

    const githubId = String(userRes.data.id);
    const username = userRes.data.name || userRes.data.login;

    await client.query("BEGIN");

    // 3️⃣ Find existing user via GitHub provider
    const existingRes = await client.query(
      `
      SELECT u.id
      FROM users u
      JOIN user_auth_providers p
        ON p.user_id = u.id
      WHERE p.provider = 'github'
        AND p.provider_user_id = $1
      `,
      [githubId]
    );

    let userId;

    if (existingRes.rows.length) {
      userId = existingRes.rows[0].id;
    } else {
      // 4️⃣ Try account linking by email
      const emailUserRes = await client.query(
        `SELECT id FROM users WHERE email = $1`,
        [email]
      );

      if (emailUserRes.rows.length) {
        userId = emailUserRes.rows[0].id;
      } else {
        // 5️⃣ Create new user
        userId = crypto.randomUUID();

        await client.query(
          `
          INSERT INTO users (id, username, email, credits, is_paid)
          VALUES ($1, $2, $3, 25, false)
          `,
          [userId, username, email]
        );
      }

      // 6️⃣ Attach GitHub provider
      await client.query(
        `
        INSERT INTO user_auth_providers
        (id, user_id, provider, provider_user_id)
        VALUES ($1, $2, 'github', $3)
        `,
        [crypto.randomUUID(), userId, githubId]
      );
    }

    await client.query("COMMIT");

    // 7️⃣ Issue JWT
    const token = signJwt({ id: userId, email, username });

    res.redirect(
      `${process.env.FRONTEND_URL}/oauth/callback?token=${token}`
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("GITHUB OAUTH ERROR:", err);

    res.redirect(
      `${process.env.FRONTEND_URL}/login?error=oauth_failed`
    );
  } finally {
    client.release();
  }
});

export default router;
