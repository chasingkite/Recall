import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
const SUBJECT = 'math';
const DECK_NAME = 'Dilation — IXL Practice';

// Authored MC cards. `back` must appear in `choices`. `explanation` is trap-specific.
const CARDS = [
  { topic: 'dilation_basics', front: 'A figure is dilated by a scale factor of k = 3. The image is...', back: 'An enlargement (larger)', choices: ['An enlargement (larger)', 'A reduction (smaller)', 'The same size', 'A rotation'], explanation: "When k > 1 the image gets bigger — that's an enlargement. Choosing 'reduction' is the classic mix-up: reductions only happen when the scale factor is between 0 and 1." },
  { topic: 'dilation_basics', front: 'A dilation has scale factor k = 2/5. The image is...', back: 'A reduction (smaller)', choices: ['A reduction (smaller)', 'An enlargement (larger)', 'The same size', 'Congruent to the original'], explanation: "A scale factor between 0 and 1 shrinks the figure, so 2/5 is a reduction. Picking 'enlargement' usually means you saw the fraction and forgot that fractions less than 1 make things smaller." },
  { topic: 'dilation_coordinate', front: 'Triangle ABC is dilated about the origin by k = 2. If A = (3, -4), what is A′?', back: '(6, -8)', choices: ['(6, -8)', '(5, -2)', '(1.5, -2)', '(3, -8)'], explanation: 'Dilation about the origin multiplies BOTH coordinates by k: (3·2, -4·2) = (6, -8). The trap (3, -8) comes from only doubling the y-value — you have to scale x too.' },
  { topic: 'dilation_coordinate', front: 'Point P(-6, 9) is dilated about the origin by k = 1/3. What is P′?', back: '(-2, 3)', choices: ['(-2, 3)', '(-18, 27)', '(-3, 6)', '(-2, 27)'], explanation: 'Multiply each coordinate by 1/3: (-6/3, 9/3) = (-2, 3). Choosing (-18, 27) means you multiplied by 3 instead of dividing — a factor of 1/3 shrinks, so the numbers get smaller.' },
  { topic: 'dilation_scale_factor', front: 'A segment is 8 cm long. After a dilation its image is 20 cm. The scale factor is...', back: '2.5', choices: ['2.5', '0.4', '12', '28'], explanation: 'Scale factor = image ÷ original = 20 ÷ 8 = 2.5. The trap 0.4 is original ÷ image (flipped). Always put the NEW length on top.' },
  { topic: 'dilation_perimeter_area', front: 'A rectangle has perimeter 24 cm. It is dilated by k = 3. The new perimeter is...', back: '72 cm', choices: ['72 cm', '27 cm', '8 cm', '216 cm'], explanation: 'Perimeter (a length) scales by k, so 24 × 3 = 72. Picking 216 means you used k² — that’s for AREA, not perimeter.' },
  { topic: 'dilation_perimeter_area', front: 'A square has area 5 cm². It is dilated by k = 4. The new area is...', back: '80 cm²', choices: ['80 cm²', '20 cm²', '9 cm²', '40 cm²'], explanation: 'Area scales by k², not k: 4² = 16, so 5 × 16 = 80 cm². The trap 20 (= 5 × 4) is the #1 mistake — you must square the scale factor for area.' },
  { topic: 'dilation_perimeter_area', front: 'Figure A has area 9 cm²; its dilated image has area 36 cm². The scale factor is...', back: '2', choices: ['2', '4', '6', '3'], explanation: 'Area grows by k², so k² = 36/9 = 4, which means k = 2. Choosing 4 forgets to take the square root — 4 is the area ratio, not the scale factor.' },
  { topic: 'dilation_scale_factor', front: 'A dilation about the origin maps X(4, 6) to X′(2, 3). The scale factor is...', back: '1/2', choices: ['1/2', '2', '-1/2', '1/4'], explanation: 'k = image ÷ original = 2/4 = 1/2 (and 3/6 = 1/2 checks out). Picking 2 flips the ratio; the image is smaller, so k must be less than 1.' },
  { topic: 'dilation_basics', front: 'Which is ALWAYS true about a figure and its dilation image?', back: 'Same shape (angles are preserved)', choices: ['Same shape (angles are preserved)', 'Same size', 'Same perimeter', 'Same position'], explanation: "Dilations change size but keep the shape — angles stay equal and the figures are similar. 'Same size' is only true for the special case k = 1, so it’s not ALWAYS true." },
  { topic: 'dilation_basics', front: 'A dilation about the origin has scale factor k = 1. The image is...', back: 'Identical to the original', choices: ['Identical to the original', 'Larger', 'Smaller', 'Reflected'], explanation: 'Multiplying every coordinate by 1 changes nothing, so the image lands exactly on the original. Any other answer assumes k ≠ 1.' },
  { topic: 'dilation_scale_factor', front: 'A segment of length 15 is dilated to an image of length 6. The scale factor is...', back: '0.4', choices: ['0.4', '2.5', '9', '21'], explanation: 'k = image ÷ original = 6/15 = 0.4. The trap 2.5 is the ratio flipped upside down; since the image is shorter, k has to be less than 1.' },
  { topic: 'dilation_perimeter_area', front: "A triangle's longest side is 6 cm. After a dilation by k = 2.5, how long is that side in the image?", back: '15 cm', choices: ['15 cm', '8.5 cm', '3.5 cm', '37.5 cm'], explanation: 'Side lengths scale by k: 6 × 2.5 = 15 cm. Choosing 8.5 (6 + 2.5) means you added the scale factor instead of multiplying.' },
  { topic: 'dilation_coordinate', front: 'Which rule represents a dilation about the origin with scale factor 3?', back: '(x, y) → (3x, 3y)', choices: ['(x, y) → (3x, 3y)', '(x, y) → (x + 3, y + 3)', '(x, y) → (3x, y)', '(x, y) → (x/3, y/3)'], explanation: 'A dilation about the origin multiplies BOTH coordinates by the scale factor: (3x, 3y). The trap (x+3, y+3) is a translation (sliding), not a dilation.' },
  { topic: 'dilation_basics', front: 'In a dilation, the one point that stays fixed (does not move) is called the...', back: 'Center of dilation', choices: ['Center of dilation', 'Scale factor', 'Image point', 'Vertex'], explanation: 'The center of dilation is the fixed point everything is stretched toward or away from; when it’s the origin, (0,0) maps to itself. The scale factor is the multiplier, not a point — that’s the mix-up here.' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Mirrors app/api/enrich/route.ts prompt exactly (called directly because the dev
// server's outbound fetch hangs in this sandbox; output is identical).
function enrichPrompt(card) {
  return `You are an educational content enricher for a 9th grade high school student's flashcard app. The student takes: Spanish 1, Biology, English 1, and Integrated Math 2. She's 14, lives in California, uses social media (TikTok, Instagram), plays sports, watches movies/shows, and cares about animals and the environment.

Flashcard:
- Subject: ${card.subject}
- Front (question): ${card.front}
- Back (answer): ${card.back}

Generate these 5 fields as JSON. Keep language simple, conversational, and relatable to a freshman:

1. "tokConnection" - A "how do we actually know this?" question (1-2 sentences). Don't be overly philosophical. Make it something a curious 14-year-old would wonder.

2. "interdisciplinary" - Connect to her OTHER classes specifically: Spanish 1, Biology, English 1, or Math 2 (1-2 sentences). Show how this concept appears in a totally different subject she's actually taking.

3. "inquiryQuestion" - A question that would spark debate with friends (1-2 sentences). No single right answer.

4. "realWorldConnection" - A specific example from her world: TikTok trends, Instagram, Netflix shows, school lunch, sports practice, California weather, her phone, gaming, or shopping (1-2 sentences). Not generic.

5. "explanation" - Why the answer is correct in plain language (2-3 sentences). Mention the #1 mistake students make on this topic.

Respond with ONLY valid JSON, no markdown:
{"tokConnection": "...", "interdisciplinary": "...", "inquiryQuestion": "...", "realWorldConnection": "...", "explanation": "..."}`;
}

async function enrichCard(card) {
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          messages: [{ role: 'user', content: enrichPrompt({ ...card, subject: SUBJECT }) }],
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) throw new Error(`anthropic ${res.status}: ${await res.text()}`);
      const data = await res.json();
      let text = data.content[0]?.text || '{}';
      text = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const e = JSON.parse(text);
      return {
        real_world_connection: e.realWorldConnection || null,
        tok_connection: e.tokConnection || null,
        interdisciplinary: e.interdisciplinary || null,
        inquiry_question: e.inquiryQuestion || null,
      };
    } catch (err) {
      lastErr = err;
      await sleep(1500 * attempt);
    }
  }
  throw lastErr;
}

async function main() {
  // Dedup against existing math fronts
  const { data: existing } = await sb.from('cards').select('front, decks!inner(subject)').eq('decks.subject', SUBJECT);
  const existingFronts = new Set((existing || []).map((c) => c.front.toLowerCase().trim()));
  const fresh = CARDS.filter((c) => !existingFronts.has(c.front.toLowerCase().trim()));
  console.log(`Cards to import: ${fresh.length} (skipped ${CARDS.length - fresh.length} duplicates)`);
  if (fresh.length === 0) return;

  // Reuse existing deck if present, else create
  let deckId;
  const { data: existingDeck } = await sb.from('decks').select('id').eq('name', DECK_NAME).eq('subject', SUBJECT).maybeSingle();
  if (existingDeck) {
    deckId = existingDeck.id;
    console.log(`Reusing deck ${DECK_NAME} (${deckId})`);
  } else {
    const { data: deck, error } = await sb.from('decks').insert({ name: DECK_NAME, subject: SUBJECT }).select().single();
    if (error) throw error;
    deckId = deck.id;
    console.log(`Created deck ${DECK_NAME} (${deckId})`);
  }

  // Enrich each card (direct Anthropic call, batches of 3 concurrently)
  const enrichedFields = new Map();
  for (let i = 0; i < fresh.length; i += 3) {
    const batch = fresh.slice(i, i + 3);
    process.stdout.write(`Enriching ${i + 1}-${i + batch.length}/${fresh.length}... `);
    const results = await Promise.allSettled(batch.map((c) => enrichCard(c)));
    results.forEach((r, j) => {
      if (r.status === 'fulfilled') {
        enrichedFields.set(batch[j].front, r.value);
      } else {
        console.log(`\n  (enrich failed for "${batch[j].front.slice(0, 30)}...": ${r.reason?.message || r.reason})`);
      }
    });
    console.log('done');
    await sleep(300);
  }

  // Build rows — authored explanation wins; other 4 fields from enrichment
  const rows = fresh.map((c) => {
    const enr = enrichedFields.get(c.front) || {};
    return {
      deck_id: deckId,
      front: c.front,
      back: c.back,
      answer_type: 'multiple-choice',
      choices: c.choices,
      topic: c.topic,
      explanation: c.explanation, // authored trap-specific, applied last
      real_world_connection: enr.real_world_connection || null,
      tok_connection: enr.tok_connection || null,
      interdisciplinary: enr.interdisciplinary || null,
      inquiry_question: enr.inquiry_question || null,
      audio_lang: 'en-US',
    };
  });

  const { error: insErr } = await sb.from('cards').insert(rows);
  if (insErr) throw insErr;

  const enrichedCount = rows.filter((r) => r.tok_connection).length;
  console.log(`\nInserted ${rows.length} MC cards. ${enrichedCount}/${rows.length} fully enriched (4 AI fields).`);
  console.log('All cards keep the authored trap-specific explanation.');
}

main().catch((e) => { console.error('FAILED:', e.message || e); process.exit(1); });
