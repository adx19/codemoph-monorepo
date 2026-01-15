import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.CLAUDE_MODEL || "claude-3-haiku-20240307";

if (!ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set in env!");
}

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function retryWithBackoff(fn, { retries = 5, baseDelay = 500 } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      const status = err?.status;
      if (attempt > retries || (status !== 429 && status !== 503)) {
        throw err;
      }
      const delay = Math.floor(baseDelay * Math.pow(2, attempt - 1));
      const jitter = Math.floor(Math.random() * delay);
      const wait = delay + jitter;
      console.warn(
        `Claude request got ${status}. Retry ${attempt}/${retries} after ${wait}ms.`
      );
      await sleep(wait);
    }
  }
}

export async function generateResponse(prompt) {
  const makeRequest = async () => {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });
      return response;
    } catch (error) {
      const status = error?.status;
      console.log("🔴 CLAUDE ERROR STATUS:", status);
      console.log(
        "🔴 CLAUDE RAW ERROR (safe):",
        JSON.stringify(error?.error || {}, null, 2)
      );
      throw error;
    }
  };

  const response = await retryWithBackoff(makeRequest, {
    retries: 5,
    baseDelay: 500,
  });

  if (!response || !Array.isArray(response.content)) {
    throw new Error("empty_response_from_claude");
  }

  const out = response.content
    .map((c) => c?.text)
    .filter(Boolean)
    .join("\n");

  if (!out || typeof out !== "string") {
    throw new Error("missing_text_in_claude_response");
  }

  return out.trim();
}