# Recall App

## Goals

### Core Learning Science

Instead of generic brain games, the app uses scientifically proven cognitive learning mechanics:

- **Spaced Repetition**: Reviews are scheduled right before forgetting occurs, automatically expanding intervals for known words (e.g., 1 day → 3 days → 7 days) and resetting missed ones to Day 1.
- **Active Recall**: Focuses on generating answers from memory (typing, speaking, or fill-in-the-blanks) rather than simple multiple-choice matching.
- **Dual Coding & Context**: Words are presented alongside visual cues, native audio pronunciation, and example sentences to build rich associations.
- **Interleaving**: Daily review decks mix related categories (e.g., nouns, verbs, phrases) rather than drilling static, isolated lists.

### Tech Stack (100% Free Tier)

- **Frontend Framework**: Next.js (React) with TypeScript for speed and structure.
- **Styling**: Tailwind CSS for mobile-first layout and responsive card designs.
- **Database & Auth**: Supabase (or Firebase) to store user progress, card decks, and schedules.
- **Audio**: Web Speech API (window.speechSynthesis) for native browser audio playback without external API costs.
- **Hosting**: Vercel for free, automatic deployments directly from GitHub.

### Product Strategy & Next Steps

- **Target Experience**: Build a Progressive Web App (PWA) optimized for phone screens (thumb-zone buttons, large touch targets, flip animations). Users can "Add to Home Screen" to run it like a native mobile app without app store approvals.
- **Phase 1 (MVP Setup)**: Spin up the local project, build the core flashcard UI component, and deploy to Vercel.
- **Phase 2 (Logic & Data)**: Integrate a simplified Leitner/SuperMemo-2 spaced repetition algorithm and connect Supabase to save card progress online across devices.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
