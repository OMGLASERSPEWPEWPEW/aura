// supabase/functions/dalle-proxy/index.ts
// Edge Function that proxies requests to OpenAI DALL-E 3 API
// This keeps the OpenAI API key server-side and secure
// Uses JWT verification to ensure only authenticated users can access

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

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

  // Verify JWT authentication
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    console.error("Missing Authorization header");
    return new Response(
      JSON.stringify({ error: { message: "Authentication required" } }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const token = authHeader.replace("Bearer ", "");

  // Validate Supabase configuration
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase configuration missing");
    return new Response(
      JSON.stringify({ error: { message: "Server configuration error" } }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Create Supabase client and verify the JWT
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    console.error("JWT verification failed:", authError?.message || "No user found");
    return new Response(
      JSON.stringify({ error: { message: "Invalid or expired authentication token" } }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  console.log(`[DALL-E] Authenticated user: ${user.id} (${user.email})`);

  try {
    const body = await req.json();
    const { prompt, size = "1024x1024", quality = "standard" } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: { message: "Prompt is required" } }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[DALL-E] Generating image: ${prompt.substring(0, 100)}...`);

    // Forward request to OpenAI DALL-E 3 API
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size,
        quality,
        response_format: "b64_json", // Return base64 for easy storage
      }),
    });

    console.log(`[DALL-E] OpenAI response status: ${response.status}`);
    const data = await response.json();

    // Log error details if not successful
    if (!response.ok) {
      console.error("[DALL-E] OpenAI error:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: data.error || { message: "DALL-E generation failed" } }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract the base64 image from response
    const imageData = data.data?.[0]?.b64_json;
    if (!imageData) {
      console.error("[DALL-E] No image data in response");
      return new Response(
        JSON.stringify({ error: { message: "No image data returned" } }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[DALL-E] Successfully generated image (${imageData.length} bytes base64)`);

    // Return the image data
    return new Response(
      JSON.stringify({
        success: true,
        image: imageData,
        revised_prompt: data.data?.[0]?.revised_prompt,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[DALL-E] Proxy error:", error);
    return new Response(
      JSON.stringify({ error: { message: "Proxy request failed" } }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
