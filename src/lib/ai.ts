// src/lib/ai.ts
import { PROFILE_ANALYSIS_PROMPT, USER_CONTEXT_PROMPT, USER_SELF_ANALYSIS_PROMPT } from './prompts';
import type { DatingGoals, DataExport, ManualEntry } from './db';

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

export async function analyzeUserBackstory(textContext: string) {
  if (!API_KEY) {
    throw new Error("Missing API Key. Please add VITE_ANTHROPIC_API_KEY to your .env file.");
  }

  if (!textContext || textContext.length < 10) {
    throw new Error("Context is too short. Please add more details to your biography or upload files.");
  }

  console.log("src/lib/ai.ts: Sending user context (" + textContext.length + " chars) to Claude...");

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
              { type: "text", text: USER_CONTEXT_PROMPT },
              { type: "text", text: `\n\nHERE IS THE USER'S CONTEXT (BIO/JOURNAL):\n${textContext}` }
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
    console.log("src/lib/ai.ts: AI Raw Response (Backstory):", rawText);
    
    // --- NUCLEAR JSON EXTRACTOR (Reused) ---
    const startIndex = rawText.indexOf('{');
    const endIndex = rawText.lastIndexOf('}');

    if (startIndex === -1 || endIndex === -1) {
      throw new Error("AI did not return a valid JSON object.");
    }

    const jsonString = rawText.substring(startIndex, endIndex + 1);
    
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("JSON Parse Failed on:", jsonString);
      throw new Error("Failed to parse AI response.");
    }

  } catch (error) {
    console.error("Fatal AI Error (Backstory):", error);
    throw error;
  }
}

// Input interface for user self-analysis
interface UserSelfAnalysisInput {
  frames?: string[];           // Video frames (base64)
  photos?: string[];           // Photo uploads (base64)
  textContext?: string;        // Combined text from journals/bios
  dataExports?: DataExport[];  // Dating app behavior stats
  datingGoals?: DatingGoals;   // User's stated goals
  manualInfo?: ManualEntry;    // Manual profile info
}

export async function analyzeUserSelf(input: UserSelfAnalysisInput) {
  if (!API_KEY) {
    throw new Error("Missing API Key. Please add VITE_ANTHROPIC_API_KEY to your .env file.");
  }

  // Check that we have at least some input
  const hasImages = (input.frames && input.frames.length > 0) || (input.photos && input.photos.length > 0);
  const hasText = input.textContext && input.textContext.length > 10;
  const hasStats = input.dataExports && input.dataExports.length > 0;
  const hasGoals = input.datingGoals && input.datingGoals.type;
  const hasManualInfo = input.manualInfo && Object.keys(input.manualInfo).some(k => input.manualInfo![k as keyof ManualEntry]);

  if (!hasImages && !hasText && !hasStats && !hasGoals && !hasManualInfo) {
    throw new Error("Please provide at least one type of input (photos, text, stats, or profile info) for analysis.");
  }

  console.log("src/lib/ai.ts: analyzeUserSelf | Building multimodal request...");

  // Build content array for the API request
  const content: Array<{ type: string; source?: { type: string; media_type: string; data: string }; text?: string }> = [];

  // Add images (limit to 6 photos + 10 video frames = 16 max to stay within context)
  const photoImages = (input.photos || []).slice(0, 6);
  const frameImages = (input.frames || []).slice(0, 10);
  const allImages = [...photoImages, ...frameImages];

  if (allImages.length > 0) {
    console.log(`src/lib/ai.ts: analyzeUserSelf | Adding ${photoImages.length} photos and ${frameImages.length} video frames`);

    allImages.forEach((img) => {
      // Handle both raw base64 and data URL formats
      const base64Data = img.includes(',') ? img.split(',')[1] : img;
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: base64Data
        }
      });
    });
  }

  // Build context text with all available data
  let contextText = "";

  if (hasGoals) {
    contextText += `\n--- DATING GOALS ---\n`;
    contextText += `Goal Type: ${input.datingGoals!.type}\n`;
    if (input.datingGoals!.description) {
      contextText += `Description: ${input.datingGoals!.description}\n`;
    }
  }

  if (hasManualInfo) {
    contextText += `\n--- USER PROFILE INFO ---\n`;
    const info = input.manualInfo!;
    if (info.name) contextText += `Name: ${info.name}\n`;
    if (info.age) contextText += `Age: ${info.age}\n`;
    if (info.occupation) contextText += `Occupation: ${info.occupation}\n`;
    if (info.location) contextText += `Location: ${info.location}\n`;
    if (info.interests && info.interests.length > 0) {
      contextText += `Interests: ${info.interests.join(', ')}\n`;
    }
    if (info.attachmentStyle) contextText += `Self-identified Attachment Style: ${info.attachmentStyle}\n`;
    if (info.relationshipHistory) contextText += `Relationship History Notes: ${info.relationshipHistory}\n`;
  }

  if (hasStats) {
    contextText += `\n--- DATING APP BEHAVIOR DATA ---\n`;
    input.dataExports!.forEach((exp) => {
      contextText += `Source: ${exp.source}\n`;
      contextText += `- Total Matches: ${exp.rawStats.matches}\n`;
      contextText += `- Conversations Started: ${exp.rawStats.conversations}\n`;
      contextText += `- Initiator Ratio: ${Math.round(exp.rawStats.initiatorRatio * 100)}% (how often they message first)\n`;
      contextText += `- Double Text Ratio: ${Math.round(exp.rawStats.doubleTextRatio * 100)}% (sending multiple messages without reply)\n`;
      contextText += `- Average Message Length: ${exp.rawStats.avgMessageLength} characters\n`;
    });
  }

  if (hasText) {
    contextText += `\n--- USER'S TEXT CONTEXT (JOURNALS/BIOS) ---\n`;
    contextText += input.textContext;
  }

  // Add the prompt and context
  content.push({
    type: "text",
    text: USER_SELF_ANALYSIS_PROMPT + (contextText ? `\n\n--- PROVIDED INPUT DATA ---\n${contextText}` : '')
  });

  console.log("src/lib/ai.ts: analyzeUserSelf | Sending request to Claude...");

  // Debug info collector
  const debugInfo: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    imageCount: allImages.length,
    hasText: !!contextText,
  };

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
        max_tokens: 8192,
        messages: [
          {
            role: "user",
            content: content
          }
        ]
      })
    });

    debugInfo.responseStatus = response.status;
    debugInfo.responseOk = response.ok;

    if (!response.ok) {
      const errorData = await response.json();
      debugInfo.errorData = errorData;
      localStorage.setItem('aura_debug_info', JSON.stringify(debugInfo, null, 2));
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    debugInfo.hasContent = !!data.content;
    debugInfo.contentLength = data.content?.length;

    if (!data.content || !data.content[0] || !data.content[0].text) {
      debugInfo.fullResponse = data;
      localStorage.setItem('aura_debug_info', JSON.stringify(debugInfo, null, 2));
      throw new Error("API returned unexpected response structure");
    }

    const rawText = data.content[0].text;
    debugInfo.rawTextLength = rawText.length;
    debugInfo.rawTextPreview = rawText.substring(0, 2000);

    // --- NUCLEAR JSON EXTRACTOR (Reused) ---
    const startIndex = rawText.indexOf('{');
    const endIndex = rawText.lastIndexOf('}');

    debugInfo.jsonStartIndex = startIndex;
    debugInfo.jsonEndIndex = endIndex;

    if (startIndex === -1 || endIndex === -1) {
      debugInfo.fullRawText = rawText;
      localStorage.setItem('aura_debug_info', JSON.stringify(debugInfo, null, 2));
      throw new Error("AI did not return a valid JSON object.");
    }

    const jsonString = rawText.substring(startIndex, endIndex + 1);
    debugInfo.extractedJsonLength = jsonString.length;

    try {
      const parsed = JSON.parse(jsonString);
      // Success - clear debug info
      localStorage.removeItem('aura_debug_info');
      return parsed;
    } catch (parseError) {
      debugInfo.parseError = String(parseError);
      debugInfo.extractedJson = jsonString;
      localStorage.setItem('aura_debug_info', JSON.stringify(debugInfo, null, 2));
      throw new Error("Failed to parse AI response. Debug info saved - click 'Download Debug' to see details.");
    }

  } catch (error) {
    // Ensure debug info is saved for any error
    debugInfo.finalError = String(error);
    localStorage.setItem('aura_debug_info', JSON.stringify(debugInfo, null, 2));
    throw error;
  }
}