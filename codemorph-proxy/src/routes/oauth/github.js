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
  console.log("BACKEND_URL =", process.env.BACKEND_URL);

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

  try {
    // ✅ Exchange code for access token
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

    // ✅ Fetch GitHub user
    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${githubToken}` },
    });

    const emailRes = await axios.get("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${githubToken}` },
    });

    const email =
      emailRes.data.find((e) => e.primary && e.verified)?.email ||
      emailRes.data[0].email;

    const githubId = String(userRes.data.id);
    const username = userRes.data.name || userRes.data.login;

    // ✅ Find or create user
    let userId;

    const [[existing]] = await pool.query(
      `
      SELECT u.id
      FROM users u
      JOIN user_auth_providers p ON p.user_id = u.id
      WHERE p.provider = 'github'
        AND p.provider_user_id = ?
      `,
      [githubId]
    );

    if (existing) {
      userId = existing.id;
    } else {
      // check by email (account linking)
      const [[emailUser]] = await pool.query(
        `SELECT id FROM users WHERE email = ?`,
        [email]
      );

      if (emailUser) {
        userId = emailUser.id;
      } else {
        userId = crypto.randomUUID();

        await pool.query(
          `
          INSERT INTO users (id, username, email, credits, is_paid)
          VALUES (?, ?, ?, 25, 0)
          `,
          [userId, username, email]
        );
      }

      await pool.query(
        `
        INSERT INTO user_auth_providers
        (id, user_id, provider, provider_user_id)
        VALUES (?, ?, 'github', ?)
        `,
        [crypto.randomUUID(), userId, githubId]
      );
    }

    // ✅ Issue JWT
    const token = signJwt({ id: userId, email, username });

    // ✅ Redirect to frontend
    res.redirect(
      `${process.env.FRONTEND_URL}/oauth/callback?token=${token}`
    );
  } catch (err) {
    console.error(err);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
});

export default router;
