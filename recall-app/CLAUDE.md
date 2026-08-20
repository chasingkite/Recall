# Recall App

## Mission

A spaced repetition study app for Hailey (9th grade) and Connor that uses scientifically-proven cognitive learning mechanics to build long-term memory retention across Spanish, Biology, English, and Math.

## Core Principles

### How Memory Works (Guide ALL card creation)

1. **Active Recall (Testing Effect)**: The brain learns by RETRIEVING, not re-reading. Cards must force generation of answers from memory.
2. **Forgetting Curve & Spaced Repetition (FSRS)**: Review right at the edge of forgetting. The app uses FSRS algorithm to personalize intervals per card per student.
3. **Elaborative Encoding**: Anchor new facts to existing knowledge via TOK connections, interdisciplinary links, and real-world context.

### Flashcard Design Rules

**DO put on a flashcard:**
- Arithmetic & math facts (instant recall)
- Formulas & identities
- Definitions & visual concepts
- Strategy prompts ("When do you use X over Y?")
- Pattern-recognition multiple choice (PSAT-style)
- Vocabulary with retrieval prompts (not bare terms)

**DO NOT put on a flashcard:**
- Multi-step problems requiring scratch paper
- Entire paragraphs or lists of 4+ items (violates atomic principle)
- Definition-recall ("What is X?") when application-recall works better

### The Atomic Principle

One concept per card. If the back has more than ~2 sentences or tests multiple facts, split it. The brain should retrieve ONE thing instantly.

**Bad:** "Properties of a parallelogram (4 things)" → listing from memory
**Good:** "Opposite sides of a parallelogram are..." → "Parallel AND equal" (one fact)

### Retrieval Prompts > Bare Terms

Never put just a term on the front. Force the student to THINK.

**Bad (Spanish):** "rojo" → "red"
**Good:** "What is the Spanish word for the color of blood or fire?" → "rojo"

**Bad (Math):** "What is the quadratic formula?" → recite formula
**Good:** "When do you use the quadratic formula?" → "When you can't factor ax²+bx+c=0"

**Bad (Biology):** "What is excretion?" → definition
**Good:** "What process removes waste made by chemical reactions in cells?" → "excretion"

### Math Cards: Two Layers

Math has Procedural Execution (multi-step solving) and Fact/Concept Retrieval (instant recall). Flashcards serve the SECOND layer only — automating building blocks so working memory is free for complex problem-solving.

**Card types for math:**
- Instant facts: "x⁰ = ?" → "1"
- Pattern recognition: "Even power of a negative is..." → "positive"
- Strategy prompts: "You know 2 sides + included angle. Which method?" → "SAS"
- PSAT-style MC: "Scale factor 5 → area ratio: A) 5 B) 10 C) 15 D) 25" → "D) 25"
- Formula recall: "Volume of a cone =" → "⅓πr²h"

### Enrichment Fields (AI-Generated)

Every card gets 5 enrichment fields via Claude API:

1. **explanation** — WHY the answer is correct + common mistakes (shown when wrong)
2. **realWorldConnection** — Concrete example a teenager relates to (phones, sports, social media, school)
3. **tokConnection** — Theory of Knowledge: HOW do we know this? Challenge assumptions about the nature of knowledge itself.
4. **interdisciplinary** — Connect to 2+ other subjects explicitly. Show same idea in different fields.
5. **inquiryQuestion** — Open-ended, no single correct answer. Makes the student pause and think critically.

### Answer Type Variety

Each study session mixes answer types to prevent pattern fatigue:

- **Type-in** (hardest — pure active recall)
- **Fill-in-the-blank** (partial cue)
- **Multiple choice** (pattern recognition, auto-generated distractors)
- **True/False** (Spanish only — "X means Y")
- **Reverse** (Spanish only — show English, type Spanish)

### Subject-Specific Guidelines

**Spanish:** Use reverse cards. True/false works well. Include audio via Web Speech API. Connect to cultural context.

**Math:** Follow the two-layer framework. No multi-step problems. Strategy prompts and pattern-recognition MC are highest value.

**Biology:** Atomic facts about processes. Avoid cramming entire systems onto one card. Split by function/component.

**English:** Literary terms as application ("identify the climax" not "define climax"). SAT vocab as contextual use, not dictionary definitions.

## Tech Stack

- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4
- **Database & Auth**: Supabase (PostgreSQL + Google OAuth)
- **Spaced Repetition**: FSRS algorithm (per-card stability/difficulty)
- **AI Enrichment**: Claude Haiku API for TOK/interdisciplinary generation
- **Hosting**: Vercel (chasingkite.com)
- **Card Import**: CSV/TSV/Anki (.apkg) with deduplication

## Users

- **Admin (hnguyen417@gmail.com)**: Manages users, imports decks, views all student progress
- **Hailey (haileyoliviatran@gmail.com)**: Student, Canvas linked (ID: 81991), all subjects
- **Connor (connorarestran@gmail.com)**: Student, no Canvas, English + Math

## Improving Card Generation

### When creating cards from study materials:

1. Read the source material (PDF/textbook)
2. Identify vocabulary panels, theorem boxes, key concepts
3. Apply the atomic principle — one fact per card
4. Write retrieval prompts (not bare terms)
5. For math: categorize as fact/formula/strategy/pattern-MC
6. Export as CSV (front, back, topic)
7. Import via Admin → Enrich with AI → Save to Recall
8. Dedup automatically prevents duplicates

### Quality checklist before export:

- [ ] Is each card atomic? (one concept only)
- [ ] Does the front force retrieval? (not just "What is X?")
- [ ] For math: is it fact-retrieval, NOT a multi-step problem?
- [ ] For Spanish: are there reverse-direction cards?
- [ ] Are PSAT-style MC cards included for pattern recognition?
- [ ] Would a student need scratch paper? If yes → don't make it a card

### Converting Anki decks:

1. Extract .apkg (it's a zip with SQLite)
2. Parse the notes table (fields separated by \x1f)
3. Strip HTML tags and [sound:] references
4. Handle cloze deletions ({{c1::answer}}) → fill-blank format
5. Export as TSV
6. Filter for level-appropriate content
7. Import + AI enrich

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
