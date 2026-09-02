# Recall

Spaced repetition study app for high school students (Hailey, Connor). Built with Next.js 16, React 19, Supabase, and the FSRS algorithm.

## Quick Start

```bash
cd recall-app
yarn install    # uses npm.apple.com registry (see .npmrc override in memory)
yarn dev        # starts Next.js dev server
```

Hosted on Vercel at chasingkite.com.

## Project Structure

All source lives under `recall-app/`. This is a single Next.js app (not a monorepo).

```
recall-app/
├── app/
│   ├── page.tsx              # Main SPA shell — tabbed UI, role-based tabs
│   ├── login/page.tsx        # Google OAuth via Supabase
│   ├── auth/callback/route.ts
│   ├── components/
│   │   ├── StudyTab.tsx      # Core study (start → sheet → studying → done)
│   │   ├── DashboardTab.tsx  # Student Canvas assignments dashboard
│   │   ├── ProgressTab.tsx   # Study stats + mastery bars + LearningLadder
│   │   ├── RewardsTab.tsx    # Points economy + reward shop + parent gate
│   │   ├── AdminTab.tsx      # Admin panel — import, audit, manage users
│   │   ├── AdminDashboard.tsx # Family dashboard — per-student grades, streaks, mastery
│   │   ├── ImportDeck.tsx    # CSV/TSV/Anki import → AI enrichment → Supabase
│   │   ├── ImageToCards.tsx  # Photo/PDF → Claude Vision → flashcards
│   │   ├── CardAuditor.tsx   # Browse/edit/delete + rule-based audit + AI Fix All
│   │   ├── StudySheet.tsx    # AI-generated pre-quiz review sheet
│   │   ├── GapAnalysis.tsx   # Post-session weak topic analysis
│   │   ├── LearningLadder.tsx # Per-topic L1-L5 progression
│   │   ├── StreakBadge.tsx   # Streak display with freeze count
│   │   ├── MemoryScoreWidget.tsx # FSRS retrievability % with daily trend
│   │   ├── CelebrationModal.tsx  # Confetti overlay on 20%+ memory improvement
│   │   ├── CardView.tsx      # Reusable card display (MC, T/F, type, fill-blank)
│   │   └── study/            # AudioButton, FlashCard, StudyTimer, etc.
│   ├── api/
│   │   ├── smart-session/    # FSRS-aware session builder + Canvas topic matching
│   │   ├── card-review/      # FSRS v5 review recording + memory score
│   │   ├── daily-progress/   # Daily goal tracking (20 cards)
│   │   ├── streaks/          # Streak data (current, longest, freezes)
│   │   ├── topic-levels/     # Learning ladder progression (L1-L5)
│   │   ├── points/           # Points economy (earn, redeem, approve/deny)
│   │   ├── enrich/           # Claude Haiku — 5 enrichment fields per card
│   │   ├── score-explanation/ # AI scoring for explain-back answers
│   │   ├── study-sheet/      # AI pre-quiz study sheet generation
│   │   ├── gap-analysis/     # AI post-session weak topic analysis
│   │   ├── image-to-cards/   # Claude Vision — extract cards from photos/PDFs
│   │   ├── audit/            # Rule-based card quality scan
│   │   ├── audit-fix/        # AI-suggested card fixes
│   │   ├── audit-correctness/ # AI fact-checking for imported cards
│   │   ├── assign-topics/    # AI topic categorization
│   │   ├── canvas/           # Direct Canvas API proxy
│   │   ├── canvas-sync/      # Cached Canvas data (1-hour TTL)
│   │   └── seed/             # DB seeding endpoint
│   └── lib/
│       ├── spaced-repetition.ts # FSRS + answer checking (Levenshtein, normalization)
│       ├── sample-cards.ts      # StudyCard type + sample data (MAX_SESSION_SIZE = 20)
│       ├── study-stats.ts       # localStorage stats (legacy)
│       ├── points.ts            # Client-side points API wrapper
│       └── supabase/            # client.ts, server.ts, db-types.ts
├── middleware.ts             # Auth guard — redirects unauthenticated to /login
└── public/math/              # SVG images for math card visuals
```

## Tech Stack

- **Next.js 16** + **React 19** + **TypeScript** + **Tailwind CSS v4** (PWA)
- **Supabase**: PostgreSQL + Google OAuth + RLS
- **FSRS v5**: Per-card stability, difficulty, retrievability tracking
- **Claude Haiku** (`claude-haiku-4-5-20251001`): Enrichment, scoring, study sheets, gap analysis, audit fixes, image-to-cards
- **Canvas LMS API**: Grade syncing and assignment tracking (student ID 81991)
- **Package manager**: yarn 1.x (`.npmrc` overrides registry to public npm)

## Key Env Vars (in .env.local)

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase connection
- `ANTHROPIC_API_KEY` — Claude API for all AI features
- `CANVAS_API_TOKEN` — Canvas LMS bearer token

## Database (Supabase)

Key tables:
- `profiles` — user accounts (role, canvas_student_id, subjects[])
- `decks` — card collections (name, subject, shared, created_by)
- `cards` — flashcards (front, back, answer_type, choices[], topic, enrichment fields)
- `card_reviews` — FSRS state per user per card (stability, difficulty, next_review_at)
- `study_sessions` — per-session tracking (cards_reviewed, cards_correct, topics[], subjects[])
- `daily_progress` — daily goal tracking (cards_reviewed, goal_met)
- `memory_scores` — daily retrievability averages and improvement %
- `streaks` — current/longest streak, freeze count
- `points_ledger` / `points_transactions` / `redemptions` — points economy
- `canvas_cache` — cached Canvas API responses (1-hour TTL)
- `topic_levels` — per-topic L1-L5 progression
- `push_subscriptions` — Web Push subscription storage (table scaffolded, not yet implemented)

### Migration
`recall-app/supabase-migration.sql` — creates all engagement tables, indexes, and RLS policies. Run in Supabase SQL Editor.

## Architecture Notes

- **SPA with tab navigation**: Single `page.tsx` renders all tabs client-side. No Next.js routing beyond login/auth.
- **Admin vs Student views**: Role-based. Admin sees AdminDashboard + AdminTab. Students see DashboardTab + StudyTab + ProgressTab + RewardsTab.
- **Study flow**: Start → optional study sheet → card quiz (6 answer types) → FSRS update → wrong card re-queue → done screen with gap analysis
- **Smart sessions**: FSRS-aware card selection prioritized by Canvas upcoming assignments
- **Card import**: CSV/image → preview → AI enrich (batches of 3) → dedup → save. Subject must be selected (no default).
- **Audit pipeline**: Rule-based scan + AI fix (individual or batch Fix All)
- **Points economy**: Earn from sessions/accuracy/streaks → spend on rewards → parent approval gate
- **Learning ladder**: Per-topic L1-L5 progression, level up at ≥80% accuracy on 10+ cards

## Card Design Rules

See `recall-app/CLAUDE.md` for detailed flashcard design principles (atomic principle, retrieval prompts, math two-layer framework, enrichment field guidelines, subject-specific rules).
