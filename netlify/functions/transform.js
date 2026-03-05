// netlify/functions/transform.js
// ROLECRFT LLM proxy (Groq): multi-model routing + JSON-safe output (validate + auto-repair once)

const ALLOWED_MODELS = new Set([
  "openai/gpt-oss-120b",
  "qwen/qwen3-32b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant"
]);

function extractFirstJsonObject(raw) {
  if (!raw) throw new Error("Empty model output");
  const text = String(raw)
    .trim()
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model output");
  }
  return text.slice(start, end + 1);
}

async function callGroq({ apiKey, model, prompt, temperature = 0.2, max_tokens = 4096, response_format }) {
  let sysMsg = "You are a strict JSON generator. Output ONLY one valid JSON object. " +
    "No markdown, no code fences, no explanations, no extra text. " +
    "The output MUST start with '{' and end with '}'. " +
    "All strings must be properly escaped. Never use unescaped quotes inside string values.";

  if (model === "openai/gpt-oss-120b") {
    sysMsg += " Be concise — use the fewest words needed. Avoid filler phrases and repetition.";
  }
  if (model === "qwen/qwen3-32b") {
    sysMsg += " /no_think";
  }

  const body = {
    model,
    messages: [
      { role: "system", content: sysMsg },
      { role: "user", content: prompt }
    ],
    temperature,
    max_tokens
  };

  if (response_format && typeof response_format === "object") {
    body.response_format = response_format;
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const raw = await response.text();

  if (!response.ok) {
    let errMsg = `Groq API ${response.status}`;
    try {
      const errData = JSON.parse(raw);
      errMsg = errData?.error?.message || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  const data = JSON.parse(raw);
  const content = data?.choices?.[0]?.message?.content || "";
  if (!content.trim()) throw new Error("Model returned empty content");
  return content;
}

async function repairToValidJson({ apiKey, model, brokenText }) {
  const repairPrompt =
    "Fix the following into ONE valid JSON object.\n" +
    "Rules:\n" +
    "- Output ONLY JSON (no markdown, no prose).\n" +
    "- Keep the same keys and structure.\n" +
    "- Fix missing commas, trailing commas, broken quotes, truncated content.\n" +
    "- If content was truncated, close all open arrays/objects.\n" +
    "- Remove any text before/after the JSON.\n\n" +
    "CONTENT TO FIX:\n" +
    String(brokenText).slice(0, 6000);

  const repaired = await callGroq({
    apiKey,
    model,
    prompt: repairPrompt,
    temperature: 0.0,
    max_tokens: 6000
  });

  const repairedJsonStr = extractFirstJsonObject(repaired);
  JSON.parse(repairedJsonStr);
  return repairedJsonStr;
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, message: "Transform is live. POST { prompt, model?, temperature?, max_tokens? }" })
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing request body" }) };

    let payload;
    try { payload = JSON.parse(event.body); } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON body" }) };
    }

    const prompt = payload?.prompt;
    if (!prompt || typeof prompt !== "string") {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing or invalid 'prompt' field" }) };
    }

    const model = typeof payload?.model === "string" ? payload.model : "qwen/qwen3-32b";
    if (!ALLOWED_MODELS.has(model)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: `Model not allowed: ${model}` }) };
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Missing GROQ_API_KEY env var" }) };
    }

    const temperature = typeof payload.temperature === "number" ? Math.min(Math.max(payload.temperature, 0), 1) : 0.2;
    const max_tokens = typeof payload.max_tokens === "number" ? Math.min(Math.max(payload.max_tokens, 500), 12000) : 4096;
    const response_format = payload?.response_format;

    const modelText = await callGroq({ apiKey, model, prompt, temperature, max_tokens, response_format });

    let jsonStr;
    try {
      jsonStr = extractFirstJsonObject(modelText);
      JSON.parse(jsonStr);
    } catch {
      jsonStr = await repairToValidJson({ apiKey, model, brokenText: modelText });
    }

    return { statusCode: 200, headers, body: JSON.stringify({ content: [{ type: "text", text: jsonStr }] }) };
  } catch (error) {
    console.error("Transform error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error?.message || "Internal server error" }) };
  }
};
