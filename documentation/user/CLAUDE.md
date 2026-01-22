# Aura Project Guide

## Project Overview
Aura is a "Local-First" Progressive Web App (PWA) designed to build Emotional Literacy. It analyzes dating app profiles via screen recordings to identify behavioral patterns (green/red flags) using AI, acting as a private "Therapist Council" rather than a score calculator.

## Tech Stack
- **Framework:** React 19 + TypeScript + Vite 7
- **Styling:** Tailwind CSS 3.4
- **Database:** Dexie.js (IndexedDB wrapper) for local storage
- **AI:** Anthropic API (Claude Sonnet 4.5) called client-side
- **Deployment:** Static Build (GitHub Pages / Vercel compatible)

## Critical Directories
- `src/lib/`: Core business logic (AI, DB, Video Processing).
- `src/pages/`: Application views (Home, Upload, ProfileDetail).
- `src/components/`: Reusable UI elements.
- `src/styles/`: Global styles and Tailwind config.

## Development Commands
- **Start Dev Server:** `npm run dev` (Runs on localhost:5173)
- **Build for Prod:** `npm run build`
- **Lint:** `npm run lint`
- **Preview Build:** `npm run preview`

## Architecture & Logic
- **Data Flow:** Video Input -> Frame Extraction -> AI Analysis -> Local DB -> UI Display
- **Privacy:** User data never leaves the device (except anonymous frames sent to LLM).
- **Video Handling:** Handled via hidden Canvas elements; no server uploads.

## Additional Documentation
- Architectural Patterns: `.claude/docs/architectural_patterns.md`
- Vision & Philosophy: `aura_vision.md`
- Technical Handoff: `technical_handoff.md`
- Project Roadmap: `roadmap_status.md`

## Key File References
- AI Logic: `src/lib/ai.ts:6` (analyzeProfile)
- Database Schema: `src/lib/db.ts:18` (Dexie definition)
- Frame Extraction: `src/lib/frameExtraction.ts`