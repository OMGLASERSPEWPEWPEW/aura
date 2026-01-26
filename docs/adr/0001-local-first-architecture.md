# ADR-0001: Local-First Architecture

## Status
Accepted

## Date
2025-01-01

## Context
Aura analyzes dating app profiles via screen recordings to provide psychological insights. This involves processing sensitive personal data including:
- Video recordings of dating profiles
- AI-generated personality analysis
- User's own profile information

We needed to decide where to store and process this data. Options included:
1. Traditional cloud backend with database
2. Local-first with on-device storage
3. Hybrid approach

Privacy is paramount for a dating-related app. Users must trust that their analyzed profiles and personal insights won't be stored on external servers or potentially leaked.

## Decision
We chose a **local-first architecture** where all user data stays on the device:

- **Video processing**: Videos are processed locally via HTML5 Canvas API, never uploaded
- **Data storage**: All profiles and user data stored in IndexedDB (browser storage)
- **AI analysis**: Frames are sent to LLM for analysis, but no PII is stored server-side
- **No backend database**: Zero server-side persistence of user data

## Consequences

### Positive
- **Maximum privacy**: User data never leaves their device
- **Offline capable**: App works without internet (except for AI analysis)
- **No data breaches**: No central database to compromise
- **GDPR compliant**: No server-side personal data to manage
- **Instant operations**: No network latency for local operations
- **Zero infrastructure cost**: No database hosting or maintenance

### Negative
- **No cross-device sync**: Data is trapped on one device (addressed later in ADR-0008)
- **Data loss risk**: If user clears browser data, profiles are lost
- **Storage limits**: Browser storage has quotas (~50MB-unlimited depending on browser)
- **No collaborative features**: Can't share profiles between users

## Related
- Git commit: `3d88ce8` (Initial commit)
- `src/lib/db.ts` - Dexie database schema
- ADR-0003: Dexie over Raw IndexedDB
- ADR-0008: Authentication & Cross-Device Sync (extends this decision)
