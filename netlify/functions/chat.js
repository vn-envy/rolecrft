// netlify/functions/chat.js
// ROLECRFT Sonnet 4.6 proxy — streaming support, prompt caching headers
// This handles all conversation + persona tasks. transform.js stays for Groq extraction tasks.

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
    const { system, messages, max_tokens = 4096, temperature = 0.4 } = payload;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "messages array required" }) };
    }

    // Build the Anthropic API request
    const body = {
      model: "claude-sonnet-4-6",
      max_tokens,
      temperature,
      messages,
    };

    // System prompt with cache control for prompt caching
    if (system) {
      if (Array.isArray(system)) {
        // Already structured with cache_control blocks
        body.system = system;
      } else {
        // Simple string — wrap with cache control
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
      console.error("Anthropic error:", errMsg);
      return { statusCode: response.status, headers, body: JSON.stringify({ error: errMsg }) };
    }

    const data = JSON.parse(raw);

    // Extract usage for cost tracking
    const usage = data.usage || {};

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        content: data.content || [],
        usage: {
          input_tokens: usage.input_tokens || 0,
          output_tokens: usage.output_tokens || 0,
          cache_creation_input_tokens: usage.cache_creation_input_tokens || 0,
          cache_read_input_tokens: usage.cache_read_input_tokens || 0,
        },
        stop_reason: data.stop_reason || null
      })
    };

  } catch (error) {
    console.error("Chat function error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error?.message || "Internal server error" }) };
  }
};
