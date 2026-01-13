// src/lib/ai.ts
import { PROFILE_ANALYSIS_PROMPT } from './prompts';

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export async function analyzeProfile(frames: string[]) {
  if (!API_KEY) {
    throw new Error("Missing API Key. Please add VITE_ANTHROPIC_API_KEY to your .env file.");
  }

  if (!frames || frames.length === 0) {
    throw new Error("No frames provided for analysis.");
  }

  console.log("src/lib/ai.ts: Sending " + frames.length + " frames to Claude...");

  const imageContent = frames.map(frame => ({
    type: "image",
    source: {
      type: "base64",
      media_type: "image/jpeg",
      data: frame.split(',')[1] 
    }
  }));

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true" 
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929", 
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              ...imageContent,
              { type: "text", text: PROFILE_ANALYSIS_PROMPT }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const rawText = data.content[0].text;
    console.log("AI Raw Response:", rawText); // Debugging: See exactly what AI sent
    
    // --- NUCLEAR JSON EXTRACTOR ---
    // Find the first '{' and the last '}'
    const startIndex = rawText.indexOf('{');
    const endIndex = rawText.lastIndexOf('}');

    if (startIndex === -1 || endIndex === -1) {
      throw new Error("AI did not return a valid JSON object.");
    }

    // Extract only the JSON part
    const jsonString = rawText.substring(startIndex, endIndex + 1);
    
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("JSON Parse Failed on:", jsonString);
      throw new Error("Failed to parse AI response. Check console for raw output.");
    }

  } catch (error) {
    console.error("Fatal AI Error:", error);
    throw error;
  }
}