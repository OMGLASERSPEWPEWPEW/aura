// src/lib/dataParsing.ts
// This file handles the local analysis of the uploaded data.json file.

interface TinderMessage {
  to: number;
  from: string; // "You" or "Them"
  message: string;
  sent_date: string;
}

interface TinderMatch {
  match_id: string;
  messages: TinderMessage[];
}

interface TinderData {
  Messages: TinderMatch[];
}

export function parseTinderData(json: TinderData | unknown) {
  console.log("src/lib/dataParsing.ts: parseTinderData: Starting analysis...");

  const data = json as TinderData;
  const matches = data.Messages || [];

  const totalMatches = matches.length;
  let conversationCount = 0;
  let initiatedCount = 0;
  let doubleTextCount = 0;
  let totalMessageLength = 0;
  let totalMessagesSentByUser = 0;

  matches.forEach((match) => {
    // Only count conversations if messages exist
    if (match.messages && match.messages.length > 0) {
      conversationCount++;

      // Sort messages chronologically to be safe
      const sortedMsgs = match.messages.sort((a, b) => 
        new Date(a.sent_date).getTime() - new Date(b.sent_date).getTime()
      );

      // 1. Check Initiator (Did "You" send the first message?)
      if (sortedMsgs[0].from === "You") {
        initiatedCount++;
      }

      // 2. Check Message Length & Double Texting
      let consecutiveMsgs = 0;
      
      sortedMsgs.forEach((msg) => {
        if (msg.from === "You") {
          totalMessageLength += msg.message.length;
          totalMessagesSentByUser++;
          consecutiveMsgs++;
          
          if (consecutiveMsgs === 2) {
             // We count a "double text event" once we hit 2 in a row
             doubleTextCount++;
          }
        } else {
          consecutiveMsgs = 0; // Reset if they replied
        }
      });
    }
  });

  const stats = {
    matches: totalMatches,
    conversations: conversationCount,
    initiatorRatio: conversationCount > 0 ? initiatedCount / conversationCount : 0,
    doubleTextRatio: totalMessagesSentByUser > 0 ? doubleTextCount / totalMessagesSentByUser : 0,
    avgMessageLength: totalMessagesSentByUser > 0 ? Math.round(totalMessageLength / totalMessagesSentByUser) : 0
  };

  console.log("src/lib/dataParsing.ts: parseTinderData: Analysis complete", stats);
  return stats;
}

// File Length: 2018 characters