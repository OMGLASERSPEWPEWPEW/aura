# Technical Handoff & Architecture

## Stack
- **Framework:** React + TypeScript + Vite
- **Styling:** Tailwind CSS (v3 standard)
- **Database:** Dexie.js (IndexedDB wrapper) - Local storage only.
- **AI:** Anthropic API (Claude 4.5 Sonnet) - Direct browser call (MVP status).
- **Deployment:** GitHub (Private Repo).

## Critical Workflows

### 1. Video Ingestion (`frameExtraction.ts`)
- We do NOT upload video files.
- We play the video locally in a hidden HTML5 Canvas element.
- We extract ~1 frame every 2 seconds.
- We convert frames to base64 strings.

### 2. The "Brain" (`ai.ts`)
- Model: `claude-sonnet-4-5-20250929`
- **Crucial Pattern:** The "Nuclear JSON Extractor." 
- *Why:* LLMs often wrap JSON in markdown or chat text. We use a substring method to find the first `{` and last `}` to ensure valid parsing. **Do not remove this logic.**

### 3. Data Persistence (`db.ts`)
- Profiles are stored in browser memory via Dexie.
- Schema includes: `appName` (Hinge/Tinder), `timestamp`, `thumbnail` (base64), and the full `analysis` JSON object.

## Current Environment
- `.env` file contains `VITE_ANTHROPIC_API_KEY`.
- Run locally via `npm run dev -- --host` to test on iPhone.