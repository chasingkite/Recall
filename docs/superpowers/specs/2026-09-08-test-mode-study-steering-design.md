# Test Mode + Study Steering — Design

**Date:** 2026-09-08
**Author:** Hien (with Claude)
**Status:** Approved (design), pending spec review

## Motivation

Hailey has an Int Math 2 test tomorrow (2026-09-09) on Dilation. Two problems surfaced:

1. Her study sessions show cards from **all subjects** (Spanish, PSAT-math, etc.) because the smart-session builder reserves a slot for every subject in her profile. She wants to focus on Math/Dilation.
2. Sessions are **hard-coded to 5 cards** (`mode=quick5` in `StudyTab.tsx:187`). She wants to study more cards in one sitting ("Test Mode").
3. The format she missed on her worksheet — **multiple choice** — does not exist as purpose-built cards. Every Math card is `answer_type: 'type'`. She also wants the cards to **explain what she got wrong**.
4. Longer term, the admin (Hien) wants to **star/prioritize specific decks** per student so a student's normal sessions lean toward weak areas without the student having to configure anything.

## Non-Goals

- Tunable numeric deck weights (boolean star only — YAGNI).
- Per-student global deck flags (starring is per-student, not global).
- Changing the FSRS scheduling algorithm itself.
- A separate "study a single deck" screen (Focus picker covers this need).

## Delivery Plan (two tracks)

The test is tomorrow, so work splits:

- **Track 1 (tonight, content only):** Import the IXL-style MC Dilation cards with authored trap-focused explanations, then enrich them through the existing `/api/enrich` pipeline so all 5 AI fields are populated. Also usable immediately as the paper/on-screen worksheet already drafted in conversation.
- **Track 2 (durable feature, after the test):** Test Mode session sizing, Focus picker, and admin deck-starring.

## Components

### 1. IXL MC Dilation cards (content) — Track 1

- New deck: `Dilation — IXL Practice`, subject `math`.
- ~15 cards, `answer_type: 'mc'`, populated `choices[]` with plausible distractors.
- Topics drawn from existing taxonomy: `dilation_scale_factor`, `dilation_coordinate`, `dilation_perimeter_area`, `dilation_basics`.
- Each card's `explanation` field names **both the correct answer and the specific trap** a wrong pick represents. Example: "Area scales by the square of the scale factor: k² = 4² = 16, so 5 × 16 = 80 cm². Picking 20 means you scaled by k once instead of squaring."
- No UI change required: the study flow already renders `explanation` on a wrong answer (`StudyTab.tsx:954`, `CardView.tsx:187`).
- **Enrichment is part of Track 1.** The cards run through the existing `/api/enrich` pipeline (batches of 3, Claude Haiku) to populate the AI fields — `realWorldConnection`, `tokConnection`, `interdisciplinary`, `inquiryQuestion`, and `explanation`.
- **Ordering caveat (verified):** `/api/enrich` *always regenerates* `explanation` and overwrites any existing value (`enrich/route.ts:83` — the `|| card.explanation` fallback only applies if the model returns an empty string, which it does not). Therefore the import sequence is: **(a) create cards → (b) enrich to fill all 5 fields → (c) re-apply the hand-written, distractor-specific `explanation` last**, so the trap-focused explanation tied to each wrong choice is the value that persists. The AI-generated explanation is discarded for these cards; the other 4 enriched fields are kept.

### 2. Test Mode — session size selection

- **Start screen:** replace the single "Start Session" button with three choices: **Quick (5)**, **Full (20)**, **Test Mode**.
- **Test Mode size:**
  - When a topic Focus is active: pull **all due + unseen cards in that focus, capped at 40**.
  - When no focus is active: **30** cards across subjects.
- **API:** `smart-session` currently derives size from `mode` (`quick5` → 5, else 20). Add a `test` mode. Stop hard-coding `mode=quick5` in `StudyTab.tsx`; pass the chosen mode.
- The size cap constants live alongside the existing `sessionSize` logic in `smart-session/route.ts`.

### 3. Focus picker — per-session subject/topic restriction

- **Start screen:** a **Focus** control — Subject dropdown (from the user's profile subjects that actually have cards), then a Topic dropdown (topics available within the chosen subject). Both optional; default None.
- **Behavior when set:**
  - Restrict the session to the chosen subject (and topic if chosen).
  - **Skip the subject-diversity reservation** (the reserved-slots block in `smart-session/route.ts:233-276`). This reservation is the reason other subjects leak in.
- **API:** `smart-session` already accepts `subject=`. Add a `topic=` param that filters the card query and bypasses the diversity reservation when present.
- Ephemeral — the focus resets each session; nothing persisted.

### 4. Admin deck-starring — persistent per-student prioritization

- **Data model:** new table
  ```sql
  create table deck_priorities (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    deck_id uuid not null references decks(id) on delete cascade,
    starred boolean not null default true,
    created_at timestamptz not null default now(),
    unique (user_id, deck_id)
  );
  ```
  RLS: admins can read/write all rows; a student may read their own. Added to `supabase-migration.sql`.
- **Admin UI:** in `AdminDashboard.tsx`, per student, list that student's decks grouped by subject with a ⭐ toggle. Toggling upserts/deletes a `deck_priorities` row.
- **Smart-session weighting:** load the user's starred deck ids. Within each subject's reserved-slot fill:
  - starred-deck cards sort ahead of non-starred cards, and
  - a subject that contains at least one starred deck gets a slot boost (e.g., its computed weight ×1.5 before slot allocation).
- Passive: no student action required.

## Data Flow

1. Start screen reads profile subjects → renders Focus (subject/topic) + size choice.
2. `handleStart` calls `GET /api/smart-session?userId=&mode=<quick5|full|test>&subject=<subj|all>&topic=<topic|>`.
3. `smart-session`:
   - Loads profile subjects, canvas cache, FSRS reviews (unchanged).
   - Loads `deck_priorities` for the user → starred deck id set.
   - If `topic` present → filter to that topic, skip diversity reservation, size per Test Mode rule.
   - Else → existing grade-weighted diversity logic, plus starred-deck boosting.
4. Study flow renders cards; MC cards show `explanation` on a miss (existing behavior).

## Error Handling

- Missing/empty focus results → fall back to the normal (unfocused) session and surface a small "no cards for that focus" note.
- `deck_priorities` query failure → treat as no stars (session still builds).
- Test Mode cap prevents unbounded sessions.

## Testing

- **Unit (`test-unit.ts`):** Test Mode size selection (focused vs unfocused, cap at 40/30); focus filtering excludes other subjects; starred-deck sort ordering; subject slot boost math.
- **Integration (`test-integration.mjs`):** `smart-session` with `topic=` returns only that topic; `mode=test` returns > 5 cards; `deck_priorities` CRUD; a starred deck's cards appear more often than an unstarred deck in the same subject.
- **Type check:** `tsc --noEmit`.
- Run all three before commit (per project policy).

## Rollout

- Track 1 cards import can ship independently and immediately.
- Track 2 requires the migration to run in Supabase before deploy.
