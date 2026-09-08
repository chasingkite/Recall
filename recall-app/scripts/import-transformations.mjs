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
const DECK_NAME = 'Transformations — Rules & Concepts';

// Concept/rule cards. `back` must be one of `choices`. `explanation` is trap-focused.
const CARDS = [
  // --- Reflection rules ---
  { topic: 'reflection', front: 'Reflection across the line y = x maps (x, y) to…', back: '(y, x)', choices: ['(y, x)', '(−y, −x)', '(x, −y)', '(−x, y)'], explanation: 'Reflecting across y = x simply swaps the coordinates: (x, y) → (y, x). Do not confuse it with y = −x, which swaps AND negates both → (−y, −x).' },
  { topic: 'reflection', front: 'Reflection across the line y = −x maps (x, y) to…', back: '(−y, −x)', choices: ['(−y, −x)', '(y, x)', '(−x, y)', '(x, −y)'], explanation: 'Across y = −x you swap the coordinates and negate both: (x, y) → (−y, −x). The plain swap (y, x) is the y = x rule — the negatives are what make it y = −x.' },
  { topic: 'reflection', front: 'Reflection across the x-axis (y = 0) maps (x, y) to…', back: '(x, −y)', choices: ['(x, −y)', '(−x, y)', '(−x, −y)', '(y, x)'], explanation: 'Reflecting over the x-axis flips the sign of y only: (x, y) → (x, −y). Students often flip x instead — but the x-axis leaves x unchanged.' },
  { topic: 'reflection', front: 'Reflection across the y-axis (x = 0) maps (x, y) to…', back: '(−x, y)', choices: ['(−x, y)', '(x, −y)', '(−x, −y)', '(y, x)'], explanation: 'Reflecting over the y-axis flips the sign of x only: (x, y) → (−x, y). A left-right mirror changes x, keeps y.' },
  // --- Rotation rules (about the origin) ---
  { topic: 'rotation', front: 'Rotation 90° CLOCKWISE about the origin maps (x, y) to…', back: '(y, −x)', choices: ['(y, −x)', '(−y, x)', '(−x, −y)', '(x, −y)'], explanation: '90° clockwise about the origin: (x, y) → (y, −x). Counterclockwise is the opposite, (−y, x). Mixing these two up is the #1 rotation mistake.' },
  { topic: 'rotation', front: 'Rotation 90° COUNTERCLOCKWISE about the origin maps (x, y) to…', back: '(−y, x)', choices: ['(−y, x)', '(y, −x)', '(−x, −y)', '(y, x)'], explanation: '90° counterclockwise about the origin: (x, y) → (−y, x). Clockwise is the reverse, (y, −x).' },
  { topic: 'rotation', front: 'Rotation 180° about the origin maps (x, y) to…', back: '(−x, −y)', choices: ['(−x, −y)', '(y, −x)', '(−y, x)', '(x, y)'], explanation: '180° about the origin negates both coordinates: (x, y) → (−x, −y). You get the same result whether you turn clockwise or counterclockwise.' },
  // --- Dilation rules ---
  { topic: 'dilation', front: 'A dilation centered at the ORIGIN by scale factor k maps (x, y) to…', back: '(kx, ky)', choices: ['(kx, ky)', '(x + k, y + k)', '(kx, y)', '(x/k, y/k)'], explanation: 'A dilation about the origin multiplies BOTH coordinates by k: (x, y) → (kx, ky). Adding k instead would be a translation.' },
  { topic: 'dilation', front: 'A dilation by scale factor k centered at (a, b) maps (x, y) to…', back: '(k(x − a) + a, k(y − b) + b)', choices: ['(k(x − a) + a, k(y − b) + b)', '(kx + a, ky + b)', '(k(x + a) − a, k(y + b) − b)', '(kx − a, ky − b)'], explanation: 'For a center (a, b): subtract the center, scale by k, then add the center back → (k(x − a) + a, k(y − b) + b). Forgetting to add the center back is the common slip.' },
  { topic: 'dilation', front: 'A shape is dilated by scale factor k. Its perimeter is multiplied by ___ and its area by ___.', back: 'k and k²', choices: ['k and k²', 'k² and k', 'k and k', 'k² and k²'], explanation: 'Lengths (including perimeter) scale by k; area scales by k². Using k for area — or k² for perimeter — is the classic mistake.' },
  // --- Identify the transformation ---
  { topic: 'transformations_identify', front: 'One point P stays fixed. Every other point A moves to A′ with PA = PA′ and ∠APA′ = x°. What transformation is this?', back: 'Rotation', choices: ['Rotation', 'Reflection', 'Dilation', 'Translation'], explanation: 'A single fixed center, equal distances from it, and an equal turn angle = a rotation about P. A dilation would change the distance (PA′ = k·PA); a reflection has a whole line of fixed points, not one center.' },
  { topic: 'transformations_identify', front: 'Which transformation produces a mirror image (reverses orientation)?', back: 'Reflection', choices: ['Reflection', 'Rotation', 'Translation', 'Dilation'], explanation: 'Only a reflection flips orientation, like a mirror. Rotations and translations turn or slide without flipping; dilations resize.' },
  { topic: 'transformations_identify', front: 'Which transformation changes a figure’s SIZE?', back: 'Dilation', choices: ['Dilation', 'Rotation', 'Reflection', 'Translation'], explanation: 'Only a dilation changes size (unless k = 1). Rotations, reflections, and translations are rigid motions — they preserve size and shape.' },
  // --- Rigid vs similarity ---
  { topic: 'transformations_properties', front: 'Which transformations preserve BOTH size and shape (the rigid motions)?', back: 'Translations, rotations, and reflections', choices: ['Translations, rotations, and reflections', 'Dilations only', 'All four transformations', 'Dilations and rotations'], explanation: 'The rigid motions — translations, rotations, reflections — keep size AND shape (congruent image). A dilation keeps shape but changes size (similar image).' },
  { topic: 'transformations_properties', front: 'A figure and its dilation image are always…', back: 'similar', choices: ['similar', 'congruent', 'identical', 'perpendicular'], explanation: 'Dilations create SIMILAR figures — same shape, proportional sides, equal angles — but not congruent unless k = 1.' },
  // --- Compositions ---
  { topic: 'composition', front: 'When you perform a COMPOSITION of transformations, you apply them…', back: 'in the given order, one at a time', choices: ['in the given order, one at a time', 'all at once', 'in reverse order', 'only the last one'], explanation: 'Do them in order: the output of the first becomes the input of the second. Order matters — swapping the steps can land the figure somewhere different.' },
  { topic: 'composition', front: 'Dilate a point about the origin by k, THEN rotate 90° clockwise about the origin. The combined rule is…', back: '(x, y) → (ky, −kx)', choices: ['(x, y) → (ky, −kx)', '(x, y) → (kx, ky)', '(x, y) → (−ky, kx)', '(x, y) → (y, −x)'], explanation: 'Dilate first: (kx, ky). Then apply 90° clockwise (x, y) → (y, −x) to that: (ky, −kx). Always do the dilation before the rotation.' },
  // --- Lines under dilation ---
  { topic: 'dilation', front: 'A dilation maps a line that does NOT pass through the center to a line that is…', back: 'parallel to the original', choices: ['parallel to the original', 'perpendicular to the original', 'the same line', 'the x-axis'], explanation: 'A line that misses the center maps to a parallel, distinct line (slope is preserved). If it passed THROUGH the center, it would map onto itself.' },
  { topic: 'dilation', front: 'A line that passes THROUGH the center of dilation maps to…', back: 'the same line', choices: ['the same line', 'a parallel line', 'a perpendicular line', 'the y-axis'], explanation: 'A line through the center is unchanged — it maps onto itself. Only lines that miss the center move to a parallel copy. (This is the trap in the perpendicular/parallel select-all problems.)' },
  { topic: 'dilation', front: 'After any dilation, the image of a line has the same ___ as the original line.', back: 'slope', choices: ['slope', 'length', 'midpoint', 'position'], explanation: 'Dilations preserve slope and direction, so image lines are parallel to their originals. Length changes by k; slope does not.' },
  // --- Find line of reflection / center ---
  { topic: 'transformations_properties', front: 'To find the line of reflection between a point and its image, use the ___ of the segment joining them.', back: 'perpendicular bisector', choices: ['perpendicular bisector', 'midpoint', 'slope', 'length'], explanation: 'The mirror line is the perpendicular bisector of any point-to-image segment — equidistant from both and perpendicular to it.' },
  { topic: 'transformations_properties', front: 'A triangle in Quadrant III is reflected to Quadrant I. The line of reflection is most likely…', back: 'y = −x', choices: ['y = −x', 'y = x', 'x = 0', 'y = 0'], explanation: 'Reflecting across y = −x swaps Quadrant III ↔ Quadrant I. y = x keeps it in III; the axes (x = 0, y = 0) would send it to Quadrant II or IV.' },
  // --- Distance formula ---
  { topic: 'distance_formula', front: 'The distance between (x₁, y₁) and (x₂, y₂) is…', back: '√((x₂ − x₁)² + (y₂ − y₁)²)', choices: ['√((x₂ − x₁)² + (y₂ − y₁)²)', '(x₂ − x₁)² + (y₂ − y₁)²', '(x₂ − x₁) + (y₂ − y₁)', '√((x₂ + x₁)² + (y₂ + y₁)²)'], explanation: 'The distance formula is the Pythagorean theorem: square the differences, add, then take the square root. Leaving off the square root (stopping at the sum of squares) is the usual error.' },
  { topic: 'distance_formula', front: 'The distance from the point (x, y, z) to the origin in 3D is…', back: '√(x² + y² + z²)', choices: ['√(x² + y² + z²)', '√(x² + y²)', 'x² + y² + z²', 'x + y + z'], explanation: '3D distance to the origin extends the Pythagorean theorem: √(x² + y² + z²). You just add the z² term to the 2D formula.' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Mirrors app/api/enrich/route.ts prompt (called directly; dev-server outbound hangs in sandbox).
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
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 500, messages: [{ role: 'user', content: enrichPrompt({ ...card, subject: SUBJECT }) }] }),
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
  // Validate: back must be in choices
  for (const c of CARDS) {
    if (!c.choices.includes(c.back)) throw new Error(`back not in choices: ${c.front}`);
  }

  const { data: existing } = await sb.from('cards').select('front, decks!inner(subject)').eq('decks.subject', SUBJECT);
  const existingFronts = new Set((existing || []).map((c) => c.front.toLowerCase().trim()));
  const fresh = CARDS.filter((c) => !existingFronts.has(c.front.toLowerCase().trim()));
  console.log(`Cards to import: ${fresh.length} (skipped ${CARDS.length - fresh.length} duplicates)`);
  if (fresh.length === 0) return;

  let deckId;
  const { data: existingDeck } = await sb.from('decks').select('id').eq('name', DECK_NAME).eq('subject', SUBJECT).maybeSingle();
  if (existingDeck) { deckId = existingDeck.id; console.log(`Reusing deck (${deckId})`); }
  else {
    const { data: deck, error } = await sb.from('decks').insert({ name: DECK_NAME, subject: SUBJECT }).select().single();
    if (error) throw error;
    deckId = deck.id; console.log(`Created deck ${DECK_NAME} (${deckId})`);
  }

  const enrichedFields = new Map();
  for (let i = 0; i < fresh.length; i += 3) {
    const batch = fresh.slice(i, i + 3);
    process.stdout.write(`Enriching ${i + 1}-${i + batch.length}/${fresh.length}... `);
    const results = await Promise.allSettled(batch.map((c) => enrichCard(c)));
    results.forEach((r, j) => {
      if (r.status === 'fulfilled') enrichedFields.set(batch[j].front, r.value);
      else console.log(`\n  (enrich failed for "${batch[j].front.slice(0, 30)}...": ${r.reason?.message || r.reason})`);
    });
    console.log('done');
    await sleep(300);
  }

  const rows = fresh.map((c) => {
    const enr = enrichedFields.get(c.front) || {};
    return {
      deck_id: deckId, front: c.front, back: c.back, answer_type: 'multiple-choice', choices: c.choices, topic: c.topic,
      explanation: c.explanation, // authored, applied last
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
  console.log(`\nInserted ${rows.length} cards. ${enrichedCount}/${rows.length} fully enriched. All keep authored explanations.`);
}

main().catch((e) => { console.error('FAILED:', e.message || e); process.exit(1); });
