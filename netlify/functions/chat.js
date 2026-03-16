// netlify/functions/chat.js
// ROLECRFT hybrid routing: Haiku 4.5 (conversation) + Sonnet 4.6 (voice moments)
// Model selection via request body { model: "haiku" | "sonnet" }

const MODELS = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6",
};

const PRICING = {
  haiku:  { input: 1, output: 5 },    // $/M tokens
  sonnet: { input: 3, output: 15 },
};

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: "Missing ANTHROPIC_API_KEY" }) };

    const payload = JSON.parse(event.body || "{}");
    const { system, messages, max_tokens = 300, temperature = 0.4 } = payload;

    // Model routing — default to haiku for cost efficiency
    const modelKey = (payload.model === "sonnet") ? "sonnet" : "haiku";
    const modelId = MODELS[modelKey];
    const pricing = PRICING[modelKey];

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "messages array required" }) };
    }

    const body = {
      model: modelId,
      max_tokens,
      temperature,
      messages,
    };

    // System prompt with cache control
    if (system) {
      if (Array.isArray(system)) {
        body.system = system;
      } else {
        body.system = [
          {
            type: "text",
            text: system,
            cache_control: { type: "ephemeral" }
          }
        ];
      }
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31"
      },
      body: JSON.stringify(body)
    });

    const raw = await response.text();

    if (!response.ok) {
      let errMsg = `Anthropic API ${response.status}`;
      try {
        const errData = JSON.parse(raw);
        errMsg = errData?.error?.message || errMsg;
      } catch {}
      console.error(`Anthropic error (${modelKey}):`, errMsg);
      return { statusCode: response.status, headers, body: JSON.stringify({ error: errMsg }) };
    }

    const data = JSON.parse(raw);
    const usage = data.usage || {};

    // Calculate cost for this call
    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;
    const cacheRead = usage.cache_read_input_tokens || 0;
    const cacheWrite = usage.cache_creation_input_tokens || 0;
    // Cache reads are 10% of input price, cache writes are 25% more
    const inputCost = ((inputTokens - cacheRead) * pricing.input + cacheRead * pricing.input * 0.1 + cacheWrite * pricing.input * 1.25) / 1000000;
    const outputCost = (outputTokens * pricing.output) / 1000000;
    const totalCost = inputCost + outputCost;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        content: data.content || [],
        model: modelKey,
        usage: {
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cache_creation_input_tokens: cacheWrite,
          cache_read_input_tokens: cacheRead,
        },
        cost: {
          input: Math.round(inputCost * 10000) / 10000,
          output: Math.round(outputCost * 10000) / 10000,
          total: Math.round(totalCost * 10000) / 10000,
        },
        stop_reason: data.stop_reason || null
      })
    };

  } catch (error) {
    console.error("Chat function error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error?.message || "Internal server error" }) };
  }
};
