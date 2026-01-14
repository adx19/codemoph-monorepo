// utils/gemini.js
import axios from "axios";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set in env!");
  // you might throw here in prod to avoid accidental calls
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Exponential backoff w/ jitter
 */
async function retryWithBackoff(fn, { retries = 5, baseDelay = 500 } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      const status = err?.response?.status;
      // Only retry on 429 or 503 (rate-limited / service unavailable). Others rethrow.
      if (attempt > retries || (status !== 429 && status !== 503)) {
        throw err;
      }
      // Exponential backoff with full jitter
      const delay = Math.floor(baseDelay * Math.pow(2, attempt - 1));
      const jitter = Math.floor(Math.random() * delay);
      const wait = delay + jitter;
      console.warn(
        `Gemini request got ${status}. Retry ${attempt}/${retries} after ${wait}ms.`
      );
      await sleep(wait);
    }
  }
}

/**
 * generateResponse(prompt) -> string
 */
export async function generateResponse(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  // Helper to make a single API request
  const makeRequest = async () => {
    try {
      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        timeout: 45000, // 45s
      });

      return response;
    } catch (error) {
      const status = error.response?.status;

      console.log("🔴 GEMINI ERROR STATUS:", status);
      console.log(
        "🔴 GEMINI RAW ERROR (safe):",
        JSON.stringify(error.response?.data || {}, null, 2)
      );

      // Pass error so retry system catches it
      throw error;
    }
  };

  // Retry wrapper
  const response = await retryWithBackoff(makeRequest, {
    retries: 5,
    baseDelay: 500, // in ms
    shouldRetry: (err) => {
      const status = err?.response?.status;
      return status === 429 || status === 503;
    },
  });

  if (!response?.data) throw new Error("empty_response_from_gemini");

  const candidates = response.data.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    console.log("🔴 Unexpected Gemini response:", response.data);
    throw new Error("invalid_gemini_response");
  }

  // Safely extract AI output text
  const out =
    candidates[0]?.content?.parts?.[0]?.text ||
    candidates[0]?.output_text ||
    candidates[0]?.content?.parts?.map((p) => p.text).join("\n") ||
    "";

  if (!out || typeof out !== "string") {
    console.log("🔴 Missing text output:", candidates[0]);
    throw new Error("missing_text_in_gemini_response");
  }

  return out.trim();
}

