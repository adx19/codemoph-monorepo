import axios from "axios";

const HF_API_KEY = process.env.HF_API_KEY;
const MODEL = process.env.HF_MODEL || "bigcode/starcoder";

if (!HF_API_KEY) {
  console.error("HF_API_KEY is not set in env!");
}

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
      const status = err?.response?.status;
      if (attempt > retries || (status !== 429 && status !== 503)) {
        throw err;
      }
      const delay = Math.floor(baseDelay * Math.pow(2, attempt - 1));
      const jitter = Math.floor(Math.random() * delay);
      const wait = delay + jitter;
      console.warn(
        `HuggingFace request got ${status}. Retry ${attempt}/${retries} after ${wait}ms.`
      );
      await sleep(wait);
    }
  }
}

export async function generateResponse(prompt) {
  const makeRequest = async () => {
    try {
      const response = await axios.post(
        `https://router.huggingface.co/models/${MODEL}`,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 4096,
            temperature: 0.2,
            return_full_text: false,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 60000,
        }
      );
      return response;
    } catch (error) {
      const status = error?.response?.status;
      console.log("🔴 HUGGINGFACE ERROR STATUS:", status);
      console.log(
        "🔴 HUGGINGFACE RAW ERROR (safe):",
        JSON.stringify(error?.response?.data || {}, null, 2)
      );
      throw error;
    }
  };

  const response = await retryWithBackoff(makeRequest, {
    retries: 5,
    baseDelay: 500,
  });

  const out =
    response?.data?.[0]?.generated_text ||
    response?.data?.generated_text ||
    "";

  if (!out || typeof out !== "string") {
    throw new Error("missing_text_in_huggingface_response");
  }

  return out.trim();
}
