// supabase/functions/anthropic-proxy/index.ts
// Edge Function that proxies requests to Anthropic API
// This keeps the API key server-side and secure

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

// CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Validate API key is configured
  if (!ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY secret is not configured");
    return new Response(
      JSON.stringify({ error: { message: "Server configuration error: API key not found" } }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Log key info for debugging (only first/last 4 chars)
  const keyPreview = ANTHROPIC_API_KEY.length > 8
    ? `${ANTHROPIC_API_KEY.substring(0, 7)}...${ANTHROPIC_API_KEY.substring(ANTHROPIC_API_KEY.length - 4)}`
    : "too short";
  console.log(`API key loaded: ${keyPreview} (length: ${ANTHROPIC_API_KEY.length})`);

  try {
    const body = await req.json();
    console.log("Forwarding request to Anthropic...");

    // Forward request to Anthropic API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log(`Anthropic response status: ${response.status}`);
    const data = await response.json();

    // Log error details if not successful
    if (!response.ok) {
      console.error("Anthropic error:", JSON.stringify(data));
    }

    // Return response with CORS headers
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({ error: "Proxy request failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
