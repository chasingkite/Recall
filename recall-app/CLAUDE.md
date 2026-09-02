# Recall App

## Mission

A spaced repetition study app for Hailey (9th grade) and Connor that uses scientifically-proven cognitive learning mechanics to build long-term memory retention across Spanish, Biology, English, Math, and PE.

## Tech Stack

- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 (PWA)
- **Database & Auth**: Supabase (PostgreSQL + Google OAuth)
- **Spaced Repetition**: FSRS v5 algorithm (per-card stability/difficulty/retrievability)
- **AI**: Claude Haiku (`claude-haiku-4-5-20251001`) for enrichment, scoring, study sheets, gap analysis, audit fixes
- **Canvas LMS**: Grade syncing and assignment tracking (student ID 81991)
- **Hosting**: Vercel (chasingkite.com)
- **Package manager**: yarn 1.x

## Users

- **Admin (hnguyen417@gmail.com)**: Manages users, imports decks, views all student progress
- **Hailey (haileyoliviatran@gmail.com)**: Student, Canvas linked (ID: 81991), all subjects
- **Connor (connorarestran@gmail.com)**: Student, no Canvas, English + Math

## Project Structure

```
app/
├── page.tsx                    # Main SPA shell — tabbed UI, role-based tabs
├── login/page.tsx              # Google OAuth via Supabase
├── auth/callback/route.ts      # OAuth code exchange
├── components/
│   ├── StudyTab.tsx             # Core study experience (start → sheet → studying → done)
│   ├── DashboardTab.tsx         # Student Canvas assignments dashboard
│   ├── ProgressTab.tsx          # Study stats + mastery bars + LearningLadder
│   ├── RewardsTab.tsx           # Points economy + reward shop + parent gate
│   ├── AdminTab.tsx             # Admin panel — import, audit, manage users
│   ├── AdminDashboard.tsx       # Family dashboard — per-student grades, streaks, mastery
│   ├── ImportDeck.tsx           # CSV/TSV/Anki import → AI enrichment → Supabase
│   ├── ImageToCards.tsx         # Photo/PDF → Claude Vision → flashcards
│   ├── CardAuditor.tsx          # Browse/edit/delete cards + rule-based audit + AI fix
│   ├── StudySheet.tsx           # AI-generated pre-quiz review sheet
│   ├── GapAnalysis.tsx          # Post-session weak topic analysis
│   ├── LearningLadder.tsx       # Per-topic L1-L5 progression
│   ├── StreakBadge.tsx           # Streak display with freeze count
│   ├── MemoryScoreWidget.tsx    # FSRS retrievability % with daily trend
│   ├── CelebrationModal.tsx     # Confetti overlay on 20%+ memory improvement
│   ├── CardView.tsx             # Reusable card display (MC, T/F, type, fill-blank)
│   └── study/                   # AudioButton, FlashCard, StudyTimer, etc.
├── api/
│   ├── smart-session/           # FSRS-aware session builder + Canvas topic matching
│   ├── card-review/             # FSRS v5 review recording + memory score
│   ├── daily-progress/          # Daily goal tracking (20 cards)
│   ├── streaks/                 # Streak data (current, longest, freezes)
│   ├── topic-levels/            # Learning ladder progression (L1-L5)
│   ├── points/                  # Points economy (earn, redeem, approve/deny)
│   ├── enrich/                  # Claude Haiku — 5 enrichment fields per card
│   ├── score-explanation/       # AI scoring for explain-back answers
│   ├── study-sheet/             # AI pre-quiz study sheet generation
│   ├── gap-analysis/            # AI post-session weak topic analysis
│   ├── image-to-cards/          # Claude Vision — extract cards from photos/PDFs
│   ├── audit/                   # Rule-based card quality scan
│   ├── audit-fix/               # AI-suggested card fixes
│   ├── audit-correctness/       # AI fact-checking for imported cards
│   ├── assign-topics/           # AI topic categorization
│   ├── canvas/                  # Direct Canvas API proxy
│   ├── canvas-sync/             # Cached Canvas data (1-hour TTL)
│   └── seed/                    # DB seeding endpoint
└── lib/
    ├── spaced-repetition.ts     # Client-side FSRS + answer checking (Levenshtein, normalization)
    ├── sample-cards.ts          # StudyCard type + sample data (MAX_SESSION_SIZE = 20)
    ├── study-stats.ts           # localStorage stats (legacy — server-side is primary)
    ├── points.ts                # Client-side points API wrapper
    └── supabase/                # client.ts (browser), server.ts (SSR), db-types.ts
```

## Architecture

### SPA with Tab Navigation
Single `page.tsx` renders all tabs client-side. Admin sees Dashboard + Study + Progress + Admin. Students see Dashboard + Study + Progress + Rewards. Default tab: Dashboard for Canvas-linked/admin users, Study for others.

### Study Flow
1. **Start screen**: Streak badge, memory score widget, daily goal progress (20 cards)
2. **Study sheet** (optional): AI-generated review of upcoming topics
3. **Card-by-card quiz**: 6 answer types — type-in (35%), MC (30%), T/F (20%), fill-blank (15%), explain-back (10%), reverse (Spanish only)
4. **Answer checking**: Levenshtein ≤1, unicode/superscript normalization, parenthetical stripping
5. **FSRS update**: Server-side stability/difficulty/interval update per card
6. **Wrong card re-queue**: Missed cards appended for retry
7. **Done screen**: Results, points earned, daily goal progress, gap analysis
8. **Post-session**: Gap analysis identifies weak topics, sets next-session focus

### Card Import Pipeline
- **CSV/TSV**: Parse → preview → enrich (batches of 3, Claude Haiku) → dedup → save
- **Image/PDF**: Upload → Claude Vision extracts cards → preview → enrich → dedup → save
- **Anki .apkg**: Extract SQLite → parse notes → strip HTML → export TSV → import
- Subject must be selected before saving (no default — prevents mistagging)

### Card Audit System
- **Rule-based scan**: Missing enrichments, too-long text, HTML artifacts, identical front/back, bare definition prompts
- **AI fix**: Individual or batch "Fix All" — Claude rewrites flagged cards
- **Correctness check**: AI fact-checks newly imported cards

### Points & Rewards Economy
- Earn: 10 pts/session, 50 for daily goal, 5-15 for accuracy, 25 for streak milestones, 30 for memory improvement
- Spend: Game time (150-600 pts), movie night (800 pts), streak freeze (75 pts)
- Parent gate: PIN "1234" to approve/deny redemptions

### Learning Ladder
Per-topic L1-L5 progression (Beginner → Expert). Level up at ≥80% accuracy on 10+ cards.

### Canvas Integration
- Grades and assignments fetched via parent observer token
- Cached in Supabase `canvas_cache` (1-hour TTL)
- Smart session prioritizes cards matching upcoming Canvas assignments

## Database (Supabase)

Key tables:
- `profiles` — id, display_name, email, role, canvas_student_id, subjects[]
- `decks` — id, name, subject, shared, created_by
- `cards` — id, deck_id, front, back, answer_type, choices[], topic, enrichment fields
- `card_reviews` — user_id, card_id, stability, difficulty, next_review_at, reps
- `study_sessions` — user_id, cards_reviewed, cards_correct, topics[], subjects[]
- `daily_progress` — user_id, date, cards_reviewed, cards_correct, goal_met
- `memory_scores` — user_id, date, avg_retrievability, improvement_pct
- `streaks` — user_id, current_streak, longest_streak, streak_freezes_owned
- `points_ledger` — user_id, balance, total_earned
- `points_transactions` — user_id, amount, reason, metadata
- `redemptions` — id, user_id, reward_id, reward_name, cost, status
- `canvas_cache` — student_id, data (JSONB), synced_at
- `topic_levels` — per-topic L1-L5 progression
- `push_subscriptions` — Web Push subscription storage (table scaffolded, not yet implemented)

### Migration
`supabase-migration.sql` at project root — creates all engagement tables, indexes, and RLS policies. Run in Supabase SQL Editor.

## Core Principles

### How Memory Works (Guide ALL card creation)

1. **Active Recall**: Cards must force retrieval from memory, not re-reading.
2. **Forgetting Curve & FSRS**: Review at the edge of forgetting. FSRS personalizes intervals.
3. **Elaborative Encoding**: Anchor new facts via TOK, interdisciplinary, and real-world connections.

### Flashcard Design Rules

**DO:** Arithmetic facts, formulas, definitions, strategy prompts, pattern-recognition MC, vocabulary with retrieval prompts.

**DON'T:** Multi-step problems, paragraphs/lists of 4+ items, bare definition-recall when application works better.

### The Atomic Principle
One concept per card. Back should be ≤2 sentences. Split multi-fact cards.

### Retrieval Prompts > Bare Terms
Never put just a term on the front. Force the student to think.

### Math Cards: Two Layers
Flashcards serve fact/concept retrieval only — instant facts, pattern recognition, strategy prompts, PSAT-style MC, formula recall. No multi-step solving.

### Enrichment Fields (AI-Generated)
Every card gets 5 fields via Claude API:
1. **explanation** — Why the answer is correct + common mistakes
2. **realWorldConnection** — Concrete teenager-relatable example
3. **tokConnection** — Theory of Knowledge: how do we know this?
4. **interdisciplinary** — Same idea across 2+ subjects
5. **inquiryQuestion** — Open-ended critical thinking prompt

### Answer Type Variety
- **Type-in** (pure recall) / **Fill-blank** (partial cue) / **MC** (pattern recognition)
- **True/False** / **Reverse** (Spanish only) / **Explain-back** (AI-scored free text)

### Subject-Specific Guidelines
- **Spanish**: Reverse cards, T/F, audio via Web Speech API, cultural context
- **Math**: Two-layer framework, no multi-step, strategy prompts + pattern MC
- **Biology**: Atomic process facts, split by function/component
- **English**: Literary terms as application, SAT vocab as contextual use

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
