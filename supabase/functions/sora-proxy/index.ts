// supabase/functions/sora-proxy/index.ts
// Edge Function that proxies requests to OpenAI Sora API
// This keeps the OpenAI API key server-side and secure

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

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
  if (!OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY secret is not configured");
    return new Response(
      JSON.stringify({ error: { message: "Server configuration error: OpenAI API key not found" } }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await req.json();
    const { prompt, duration = 3, resolution = "1080x1920" } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: { message: "Prompt is required" } }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate prompt length
    if (prompt.length > 1000) {
      return new Response(
        JSON.stringify({ error: { message: "Prompt too long (max 1000 characters)" } }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[Sora] Generating video: ${prompt.substring(0, 100)}...`);
    console.log(`[Sora] Duration: ${duration}s, Resolution: ${resolution}`);

    // Parse resolution to width/height
    const [width, height] = resolution.split("x").map(Number);

    // Forward request to OpenAI Sora API
    // Note: Sora API endpoint and format may change - this follows expected patterns
    const response = await fetch("https://api.openai.com/v1/videos/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sora-1.0",
        prompt,
        n: 1,
        duration,
        width,
        height,
        response_format: "b64_json", // Return base64 for easy storage
      }),
    });

    console.log(`[Sora] OpenAI response status: ${response.status}`);
    const data = await response.json();

    // Log error details if not successful
    if (!response.ok) {
      console.error("[Sora] OpenAI error:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: data.error || { message: "Sora generation failed" } }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract the base64 video from response
    const videoData = data.data?.[0]?.b64_json;
    if (!videoData) {
      console.error("[Sora] No video data in response");
      return new Response(
        JSON.stringify({ error: { message: "No video data returned" } }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[Sora] Successfully generated video (${videoData.length} bytes base64)`);

    // Return the video data
    return new Response(
      JSON.stringify({
        success: true,
        video: videoData,
        revised_prompt: data.data?.[0]?.revised_prompt,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Sora] Proxy error:", error);
    return new Response(
      JSON.stringify({ error: { message: "Proxy request failed" } }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
