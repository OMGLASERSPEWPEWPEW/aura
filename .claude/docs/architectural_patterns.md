# Architectural Patterns & Conventions

## 1. Nuclear JSON Extraction
**Context:** LLMs often wrap JSON output in markdown blocks or conversational text.
**Pattern:** We use a strict substring extraction method to locate the first `{` and last `}` before parsing.
**Constraint:** Do not remove or simplify this logic; it is critical for stability.
**Reference:** `src/lib/ai.ts:54` (Nuclear JSON Extractor logic)

## 2. Local-First Persistence (The "Antivirus" Strategy)
**Context:** Privacy is paramount. We do not want a central database of user dating profiles.
**Pattern:** All persistence is handled via `Dexie.js` (IndexedDB) running directly in the browser.
**Constraint:** No backend database calls for user data. All schema changes must happen in `db.version()`.
**Reference:** `src/lib/db.ts:13`

## 3. Client-Side Frame Extraction
**Context:** Uploading video files is bandwidth-heavy and privacy-invasive.
**Pattern:** Videos are loaded into a hidden HTML5 Canvas element. Scripts extract base64 screenshots at set intervals (e.g., every 2 seconds) locally.
**Constraint:** Ensure videos are muted and playsinline to work on iOS Safari.
**Reference:** `src/lib/frameExtraction.ts` (Implied workflow)

## 4. Direct Browser AI Calls
**Context:** MVP speed and simplicity.
**Pattern:** The frontend calls the Anthropic API directly using `dangerouslyAllowBrowser: true`.
**Constraint:** API keys are stored in `.env`. (Note: This will need migration to a proxy/edge function in Phase 3 for security).
**Reference:** `src/lib/ai.ts:27`

## 5. View-Model Separation
**Context:** Keeping UI clean.
**Pattern:** Logic files in `src/lib/` handle the heavy lifting (DB, AI, Image Proc). Components in `src/pages/` consume these async functions and manage local React state.