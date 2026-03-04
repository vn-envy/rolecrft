// netlify/functions/search.js
// Web search proxy using Serper.dev (Google Search API)
// Free tier: 2,500 queries, no credit card, no attribution required

const SERPER_API = "https://google.serper.dev/search";

async function serperSearch(query, apiKey, num = 5) {
  const res = await fetch(SERPER_API, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Serper API ${res.status}: ${errText}`);
    return [];
  }

  const data = await res.json();
  const results = (data?.organic || []).slice(0, num);

  return results.map((r) => ({
    title: r.title || "",
    url: r.link || "",
    snippet: (r.snippet || "").slice(0, 400),
    date: r.date || "",
    position: r.position || 0,
  }));
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          results: {},
          searchAvailable: false,
          message: "SERPER_API_KEY not configured. Company data will use AI knowledge only.",
        }),
      };
    }

    const payload = JSON.parse(event.body || "{}");
    const queries = payload.queries;

    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Provide { queries: ['query1', 'query2'] }",
        }),
      };
    }

    const limitedQueries = queries.slice(0, 5);

    const searchPromises = limitedQueries.map((q) => serperSearch(q, apiKey, 5));
    const searchResults = await Promise.all(searchPromises);

    const resultMap = {};
    limitedQueries.forEach((q, i) => {
      resultMap[q] = searchResults[i];
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        results: resultMap,
        searchAvailable: true,
        queriesUsed: limitedQueries.length,
      }),
    };
  } catch (error) {
    console.error("Search function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error?.message || "Search failed" }),
    };
  }
};
