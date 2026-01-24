# Aura

**Local-first dating profile intelligence for the emotionally literate.**

Aura analyzes dating app profiles via screen recordings using AI to identify behavioral patterns, psychological insights, and compatibility signals. All user data stays on-device.

## Features

### Profile Analysis
- Upload screen recordings of dating profiles
- 4-chunk streaming analysis with progressive UI updates
- Photo-by-photo psychological breakdown
- Red/green flags with explanations
- Archetype classification
- Subtext analysis (power dynamics, vulnerability markers)

### Compatibility Scoring
- Build your own profile for personalized matching
- 5 Partner Virtues compatibility scoring
- 23 Aspects trait matching
- Zodiac compatibility
- Transactional indicator detection

### Match Intelligence
- Conversation coaching (upload chat screenshots)
- AI-powered response suggestions
- Response scoring (0-100)
- Custom opener generation
- Date ideas with weather integration
- Free-form Q&A about any match

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite 7
- **Styling:** Tailwind CSS 3.4
- **Storage:** Dexie.js (IndexedDB)
- **AI:** Claude API (Anthropic)
- **Hosting:** Vercel
- **API Proxy:** Supabase Edge Functions

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your VITE_ANTHROPIC_API_KEY or use proxy config

# Start development server
npm run dev
```

## Development

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # TypeScript check + production build
npm run lint      # ESLint check
npm run test:run  # Run unit tests
npm run preview   # Preview production build
```

## Environment Variables

**Local Development:**
```
VITE_ANTHROPIC_API_KEY=your_key_here
```

**Production (with proxy):**
```
VITE_USE_PROXY=true
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Privacy

Aura is **local-first**:
- All profile data stored in IndexedDB on your device
- Videos processed locally via Canvas, never uploaded
- Only extracted frames sent to AI for analysis
- No central database, no data harvesting

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Development guidelines for Claude Code
- [PROJECT_MAP.md](./PROJECT_MAP.md) - Complete feature and component inventory
- [.claude/docs/MASTER_ROADMAP.md](./.claude/docs/MASTER_ROADMAP.md) - Master roadmap and status
- [.claude/docs/aura_vision.md](./.claude/docs/aura_vision.md) - Product philosophy

## License

Private repository.
