import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import googleOAuthRoutes from "./routes/oauth/google.js";
import convertRoutes from "./routes/convert.js";
import adminRoutes from "./routes/admin.js";
import webhooks from "./routes/webhooks.js";
import transactionRoutes from "./routes/transactions.js";
import dashboardRoutes from "./routes/dashboard.js";
import paymentsRouter from "./routes/payments.js";
import sharedCreditsRoutes from "./routes/share.js";
import githubOAuthRoutes from "./routes/oauth/github.js";
import rateLimit from "express-rate-limit";

const convertLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { message: "too_many_requests" }
});
const app = express();
app.use(cors());
app.set("trust proxy", 1);
app.use("/webhooks", webhooks);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));



/* ✅ AUTH (local + OAuth) */
app.use("/auth", authRoutes);
app.use("/auth", googleOAuthRoutes);
app.use("/auth/github", githubOAuthRoutes);


app.use("/convert", convertLimiter);
/* ✅ Core routes */
app.use("/convert", convertRoutes);

app.use("/admin", adminRoutes);
app.use("/transactions", transactionRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/payments", paymentsRouter);
app.use("/shared-credits", sharedCreditsRoutes);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`CodeMorph proxy running on ${PORT}`)
);
