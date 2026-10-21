# Biology - Cells Deck (Hailey) — Design

Date: 2026-10-21

## Goal

Give Hailey flashcards for her next Biology unit: animal cell and plant cell diagrams, and prokaryotes vs eukaryotes. Her class has finished the ecology unit (Unit #2 exam done). Existing Biology decks ("Ecology and Energy", "Biomagnification and Toxins") contain no cell cards, so there is no overlap.

## Sources and limits

- `~/Documents/StudyMaterials/` has one biology file: the CGP Edexcel IGCSE workbook. It is a scan with no text layer and contains exam questions, not teaching text. It gives scope only: p.4 (levels of organisation, plant vs animal cell), p.5 (specialised cells), p.7 (protoctists, bacteria, viruses). It never uses the words prokaryote or eukaryote.
- Her Canvas Biology course shows no cell assignments yet.
- Card content is therefore written from standard high-school biology. It may not match her teacher's wording. If her slides or notes become available, the cards get adjusted to match.

## Deck

- Name: `Biology - Cells`, subject `biology`, `shared = true`, `created_by` = admin UUID (`be2522d5-b953-4fa3-9920-6cb787c14ca7`).
- About 35 cards in three topics:

| Topic | Cards | Content |
|---|---|---|
| `animal_cell` | ~11 | Nucleus, mitochondria, ribosomes, cell membrane, cytoplasm. 5 diagram-label cards plus function cards. |
| `plant_cell` | ~12 | Animal-cell parts plus cell wall, chloroplasts, large central vacuole. 5 diagram-label cards. "Plant has it, animal lacks it" cards. Cellulose location. |
| `prokaryote_eukaryote` | ~12 | Nucleus present or absent, membrane-bound organelles, relative size, DNA location, examples (bacteria vs plant, animal, fungi). 2 diagram-label cards on a bacterial cell. |

## Diagrams

- Three SVGs in `recall-app/public/bio/`: `cell-animal.svg`, `cell-plant.svg`, `cell-bacterium.svg`.
- Each uses large lettered pins (A, B, C, ...) and no text labels. The card view renders images at most 180px wide (140px in some views), so text labels would be unreadable.
- Cards reference an image through the existing `cards.image_url` column, set to `/bio/<file>.svg` (the IXL import does the same with `/math/<file>`).

## Card design

Follows `recall-app/CLAUDE.md`: one concept per card, back at most 2 sentences, retrieval prompts instead of bare terms.

- Diagram cards: mostly multiple choice (4 choices, correct answer among them), a few type-in.
- Text cards: mix of type-in, true/false and fill-blank.
- Every card has the 5 enrichment fields: explanation, real_world_connection, tok_connection, interdisciplinary, inquiry_question.

## Build

Two one-off scripts in `recall-app/scripts/`, matching the existing pattern (`generate-ixl-svgs.mjs`, `import-ixl-problems.mjs`):

1. `generate-cell-svgs.mjs` writes the three SVGs.
2. `import-cell-cards.mjs` creates the deck, enriches cards by calling Anthropic (`claude-haiku-4-5-20251001`) directly (the dev server's outbound calls are blocked in this sandbox), and inserts cards. It is idempotent: if the deck exists it reuses it and skips cards whose `front` already exists.

Run both from `recall-app/` so `@supabase/supabase-js` resolves. Use a service-role client built from `.env.local`.

## Starring

After import, star `Biology - Cells` for Hailey (`be5c10f0-adf1-4a14-90ba-19b16b250e14`) through `deck_priorities` (upsert, `onConflict: user_id,deck_id`). The two Math decks and the Of Mice and Men deck stay starred as they are. Unstarring is a separate step that needs the user's say-so.

## Verification

- Structural SVG checks (rendering is blocked in the sandbox): valid XML, every pin letter a card refers to exists in its SVG, no text labels that give away the answer.
- Card checks: every multiple-choice card's correct answer is in `choices`; no duplicate fronts; all five enrichment fields are non-empty.
- Run `node --experimental-strip-types test-unit.ts`, `node test-integration.mjs`, `node_modules/.bin/tsc --noEmit`.
- The user opens the deck in the app and checks the diagrams visually before anything is committed.

## Out of scope

- Other cell content (cell cycle, mitosis, transport across membranes, specialised cells beyond what the workbook scope implies).
- Changes to `CardView.tsx` or the study flow.
- The dashboard redesign (separate spec).
