// Creates two Ch 4.2 (IM2 4.2.2 "Using Trigonometric Ratios") decks for Hailey and stars them:
//   "Math - Trig Ratios (Ch 4.2)"   concept cards (text only)
//   "Math - Trig Practice (Ch 4.2)" 18 diagram problems (type-in), answers computed in
//                                   scripts/lib/trig42-problems.mjs
// Enrichment is called directly against Anthropic (dev-server outbound is sandbox-blocked).
// Default is a DRY RUN (verifies, writes nothing). From recall-app/:
//   node scripts/generate-trig42-svgs.mjs        # once, creates public/math/trig42-*.svg
//   node scripts/import-trig42-cards.mjs         # dry run
//   node scripts/import-trig42-cards.mjs --apply # insert decks + cards, star for Hailey
// Only --apply AFTER the SVGs are deployed (image_url points at /math/trig42-*.svg).
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { PRACTICE } from './lib/trig42-problems.mjs';

const APPLY = process.argv.includes('--apply');
const SUBJECT = 'math';
const ADMIN = 'be2522d5-b953-4fa3-9920-6cb787c14ca7';
const HAILEY = 'be5c10f0-adf1-4a14-90ba-19b16b250e14';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DECK_CONCEPT = 'Math - Trig Ratios (Ch 4.2)';
const DECK_PRACTICE = 'Math - Trig Practice (Ch 4.2)';

const mc = (topic, front, back, wrong) => ({ topic, front, back, answer_type: 'multiple-choice', choices: [back, ...wrong] });
const tf = (topic, front, back) => ({ topic, front, back: back ? 'true' : 'false', answer_type: 'true-false' });
const typ = (topic, front, back) => ({ topic, front, back, answer_type: 'type' });
const fill = (topic, front, back) => ({ topic, front, back, answer_type: 'fill-blank' });

const CONCEPT = [
  // ---- which ratio to use ----
  mc('ratio_choice', 'You know an angle and the HYPOTENUSE, and you want the side OPPOSITE the angle. Which ratio connects them?', 'Sine (sin)', ['Cosine (cos)', 'Tangent (tan)', 'Inverse sine (sin⁻¹)']),
  mc('ratio_choice', 'You know an angle and the HYPOTENUSE, and you want the side ADJACENT to the angle. Which ratio connects them?', 'Cosine (cos)', ['Sine (sin)', 'Tangent (tan)', 'Inverse cosine (cos⁻¹)']),
  mc('ratio_choice', 'You know an angle and the ADJACENT side, and you want the HYPOTENUSE. Which ratio connects them?', 'Cosine (cos)', ['Sine (sin)', 'Tangent (tan)', 'Inverse tangent (tan⁻¹)']),
  mc('ratio_choice', 'What is the FIRST step when solving a right-triangle problem with a trig ratio?', 'Label the sides opposite, adjacent, and hypotenuse relative to the given angle', ['Press sin on your calculator', 'Add up the angles to 180°', 'Square both legs']),

  // ---- setting up and solving for a side ----
  fill('side_setup', 'In sin 25° = 29/x, the unknown x is on the ___ of the fraction.', 'bottom'),
  mc('side_setup', 'Which equation gives the EXACT answer for x in sin 25° = 29/x?', 'x = 29 ÷ sin 25°', ['x = 29 × sin 25°', 'x = sin 25° ÷ 29', 'x = 29 − sin 25°']),
  mc('side_setup', 'Solve sin 40° = x/12. Which equation gives x?', 'x = 12 × sin 40°', ['x = 12 ÷ sin 40°', 'x = sin 40° ÷ 12', 'x = 12 − sin 40°']),
  tf('side_setup', 'When the unknown side is on the BOTTOM of the trig fraction, you finish by DIVIDING by the trig value.', true),
  mc('side_setup', 'What is the difference between an exact answer and an approximate answer?', 'Exact keeps the trig value in the expression (29 ÷ sin 25°); approximate is the calculator decimal (≈ 68.6)', ['Exact is always a whole number; approximate has decimals', 'Exact uses degrees; approximate uses radians', 'There is no difference']),
  typ('side_setup', 'Solve sin 25° = 29/x. What is x to the nearest tenth?', '68.6'),
  typ('side_setup', 'Solve sin 53° = y/5. What is y to the nearest hundredth?', '3.99'),

  // ---- sine and cosine of complementary angles ----
  fill('complementary', 'sin 25° = cos ___°', '65'),
  mc('complementary', 'The two acute angles of a right triangle add to 90°. So the sine of one acute angle equals the ___ of the other.', 'Cosine', ['Sine', 'Tangent', 'Hypotenuse']),
  typ('complementary', 'cos 37° = sin ___°', '53'),
  tf('complementary', 'sin 70° = cos 20°', true),
  tf('complementary', 'sin 30° = cos 30°', false),
  mc('complementary', 'Why does sin 25° equal cos 65° in the same right triangle?', 'The side opposite 25° is the side adjacent to 65°, so both ratios are the same fraction', ['They are both measured in degrees', 'The hypotenuse changes between them', 'It only works for 45° angles']),
  mc('complementary', 'To solve sin(2x) = cos(3x), what is the first step?', 'Set 2x + 3x = 90 (the angles are complementary)', ['Set 2x = 3x', 'Set 2x + 3x = 180', 'Take the inverse sine of both sides']),
  typ('complementary', 'Solve sin(2x) = cos(3x). What is x?', '18'),
  typ('complementary', 'Solve sin(x + 10) = cos(2x − 10). What is x?', '30'),

  // ---- finding an angle with inverse functions ----
  mc('inverse_choice', 'You are given the OPPOSITE side and the HYPOTENUSE and want the ANGLE. Which function do you use?', 'sin⁻¹', ['cos⁻¹', 'tan⁻¹', 'sin']),
  mc('inverse_choice', 'You are given the ADJACENT side and the HYPOTENUSE and want the ANGLE. Which function do you use?', 'cos⁻¹', ['sin⁻¹', 'tan⁻¹', 'cos']),
  tf('inverse_choice', 'sin⁻¹ means 1 ÷ sin.', false),
  mc('inverse_choice', 'What is sin⁻¹(0.5)?', '30°', ['60°', '0.5°', '45°']),
  typ('inverse_choice', 'A 10 ft ladder leans on a wall and reaches 5 ft up. What angle does it make with the ground, in degrees?', '30'),
  typ('inverse_choice', 'A triangle has an adjacent side of 5 and a hypotenuse of 10. What is the angle θ, in degrees?', '60'),
  mc('inverse_choice', 'Your calculator says sin(30°) = −0.988 instead of 0.5. What went wrong?', 'It is in radian mode, not degree mode', ['You pressed cos by mistake', 'The angle must be over 45°', 'The calculator needs the inverse button']),
];

// ---- verification (no network) ---------------------------------------------
function verify() {
  const errors = [];
  const fronts = new Set();
  const all = [...CONCEPT.map((c) => ({ ...c, deck: 'concept' })), ...PRACTICE.map((p) => ({ ...p, answer_type: 'type', deck: 'practice' }))];
  for (const c of all) {
    const id = `"${c.front.slice(0, 55)}"`;
    if (fronts.has(c.front.toLowerCase())) errors.push(`duplicate front: ${id}`);
    fronts.add(c.front.toLowerCase());
    if (c.answer_type === 'multiple-choice') {
      if (!c.choices.includes(c.back)) errors.push(`MC answer not in choices: ${id}`);
      if (new Set(c.choices).size !== c.choices.length || c.choices.length !== 4) errors.push(`MC needs 4 unique choices: ${id}`);
    }
    if (c.answer_type === 'true-false' && !['true', 'false'].includes(c.back)) errors.push(`T/F back: ${id}`);
    if (c.answer_type === 'fill-blank' && !c.front.includes('___')) errors.push(`fill-blank missing ___: ${id}`);
  }
  for (const p of PRACTICE) if (!existsSync(`public/math/trig42-${p.id}.svg`)) errors.push(`missing SVG for ${p.id} (run generate-trig42-svgs.mjs)`);

  // numeric facts the concept cards state — recompute so none is hand-typed wrong
  const rad = (d) => (d * Math.PI) / 180;
  const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;
  const checks = [
    ['29/sin25 ≈ 68.6', (29 / Math.sin(rad(25))).toFixed(1) === '68.6'],
    ['5·sin53 ≈ 3.99', (5 * Math.sin(rad(53))).toFixed(2) === '3.99'],
    ['sin25 = cos65', near(Math.sin(rad(25)), Math.cos(rad(65)))],
    ['cos37 = sin53', near(Math.cos(rad(37)), Math.sin(rad(53)))],
    ['sin70 = cos20', near(Math.sin(rad(70)), Math.cos(rad(20)))],
    ['sin30 ≠ cos30', !near(Math.sin(rad(30)), Math.cos(rad(30)))],
    ['sin(2·18)=cos(3·18)', near(Math.sin(rad(36)), Math.cos(rad(54)))],
    ['sin(30+10)=cos(2·30−10)', near(Math.sin(rad(40)), Math.cos(rad(50)))],
    ['asin(0.5)=30', near((Math.asin(0.5) * 180) / Math.PI, 30)],
    ['asin(5/10)=30 (ladder)', near((Math.asin(5 / 10) * 180) / Math.PI, 30)],
    ['acos(5/10)=60', near((Math.acos(5 / 10) * 180) / Math.PI, 60)],
    ['sin(30 rad) ≈ −0.988', Math.sin(30).toFixed(3) === '-0.988'],
  ];
  for (const [name, ok] of checks) if (!ok) errors.push(`numeric check failed: ${name}`);
  return errors;
}

// ---- enrichment ----------------------------------------------------------------
function enrichPrompt(card) {
  const answer = card.answer_type === 'multiple-choice' ? `${card.back} (choices: ${card.choices.join(' / ')})` : card.back;
  return `You are creating learning enrichment for a 9th-grade student (Hailey, 14) studying Integrated Math 2 (right-triangle trigonometry, sine/cosine/tangent).

Flashcard:
- Subject: math
- Front (question): ${card.front}${card.svg ? ' [a diagram is shown]' : ''}
- Back (answer): ${answer}

Generate these 5 fields as JSON. Keep language simple, conversational, and relatable to a freshman:

1. "tokConnection" - A "how do we actually know this?" question (1-2 sentences). Something a curious 14-year-old would wonder.
2. "interdisciplinary" - Connect to her OTHER classes: Spanish 1, Biology, English 1, or PE (1-2 sentences).
3. "inquiryQuestion" - A question that would spark debate with friends (1-2 sentences). No single right answer.
4. "realWorldConnection" - A specific example from her world: TikTok, Netflix, school lunch, sports practice, California, her phone, gaming (1-2 sentences). Not generic.
5. "explanation" - Why the answer is correct in plain language (2-3 sentences). Mention the #1 mistake students make on this topic.

Respond with ONLY valid JSON, no markdown:
{"tokConnection": "...", "interdisciplinary": "...", "inquiryQuestion": "...", "realWorldConnection": "...", "explanation": "..."}`;
}

async function enrichCard(card, apiKey) {
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 500, messages: [{ role: 'user', content: enrichPrompt(card) }] }),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) throw new Error(`anthropic ${res.status}: ${await res.text()}`);
      const data = await res.json();
      const text = (data.content[0]?.text || '{}').replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const e = JSON.parse(text);
      const out = { explanation: e.explanation, real_world_connection: e.realWorldConnection, tok_connection: e.tokConnection, interdisciplinary: e.interdisciplinary, inquiry_question: e.inquiryQuestion };
      if (Object.values(out).some((v) => !v)) throw new Error('missing enrichment field');
      return out;
    } catch (err) {
      lastErr = err;
      await sleep(1500 * attempt);
    }
  }
  throw lastErr;
}

// ---- main ----------------------------------------------------------------------
const errors = verify();
const topics = (cards) => cards.reduce((m, c) => ((m[c.topic] = (m[c.topic] || 0) + 1), m), {});
console.log(`${DECK_CONCEPT}: ${CONCEPT.length} cards`, topics(CONCEPT));
console.log(`${DECK_PRACTICE}: ${PRACTICE.length} cards`, topics(PRACTICE));
if (errors.length) {
  console.error('VERIFICATION FAILED:\n  ' + errors.join('\n  '));
  process.exit(1);
}
console.log('Verification OK (MC answers in choices, no duplicates, SVGs exist, numeric facts recomputed).');
if (!APPLY) {
  console.log('Dry run — nothing written. Re-run with --apply after the SVGs are deployed.');
  process.exit(0);
}

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')])
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function importDeck(name, cards, imageFor, authoredExplanation) {
  let { data: deck } = await sb.from('decks').select('id').eq('name', name).eq('subject', SUBJECT).maybeSingle();
  if (!deck) {
    const { data, error } = await sb.from('decks').insert({ name, subject: SUBJECT, created_by: ADMIN, shared: true }).select('id').single();
    if (error) throw error;
    deck = data;
    console.log(`Created deck ${name} (${deck.id})`);
  } else console.log(`Reusing deck ${name} (${deck.id})`);

  // dedupe on front+image: practice fronts can repeat in spirit, images make each unique
  const key = (c) => (imageFor(c) ? `${c.front}|${imageFor(c)}` : c.front).toLowerCase().trim();
  const haveKeys = new Set();
  const { data: existing } = await sb.from('cards').select('front,image_url').eq('deck_id', deck.id);
  for (const r of existing || []) haveKeys.add((r.image_url ? `${r.front}|${r.image_url}` : r.front).toLowerCase().trim());
  const fresh = cards.filter((c) => !haveKeys.has(key(c)));
  console.log(`  cards to insert: ${fresh.length} (skipping ${cards.length - fresh.length} already present)`);

  const rows = [];
  for (let i = 0; i < fresh.length; i += 3) {
    const batch = fresh.slice(i, i + 3);
    process.stdout.write(`  enriching ${i + 1}-${i + batch.length}/${fresh.length}... `);
    const results = await Promise.allSettled(batch.map((c) => enrichCard(c, env.ANTHROPIC_API_KEY)));
    results.forEach((r, j) => {
      const c = batch[j];
      if (r.status === 'rejected') console.log(`\n  (enrich failed "${c.front.slice(0, 40)}": ${r.reason?.message || r.reason})`);
      const e = r.status === 'fulfilled' ? r.value : {};
      rows.push({
        deck_id: deck.id, front: c.front, back: c.back, answer_type: c.answer_type, choices: c.choices || null,
        topic: c.topic, image_url: imageFor(c), audio_lang: 'en-US',
        explanation: authoredExplanation ? c.explanation : e.explanation || '',
        real_world_connection: e.real_world_connection || '', tok_connection: e.tok_connection || '',
        interdisciplinary: e.interdisciplinary || '', inquiry_question: e.inquiry_question || '',
      });
    });
    console.log('done');
    await sleep(300);
  }
  if (rows.length) {
    const { error } = await sb.from('cards').insert(rows);
    if (error) throw error;
    console.log(`  inserted ${rows.length} cards (${rows.filter((r) => r.tok_connection).length} fully enriched)`);
  }
  return deck.id;
}

async function main() {
  const conceptId = await importDeck(DECK_CONCEPT, CONCEPT, () => null, false);
  const practiceId = await importDeck(DECK_PRACTICE, PRACTICE.map((p) => ({ ...p, answer_type: 'type' })), (c) => `/math/trig42-${c.id}.svg`, true);
  for (const deck_id of [conceptId, practiceId]) {
    const { error } = await sb.from('deck_priorities').upsert({ user_id: HAILEY, deck_id, starred: true }, { onConflict: 'user_id,deck_id' });
    if (error) throw error;
  }
  const { data: stars } = await sb.from('deck_priorities').select('deck_id').eq('user_id', HAILEY).eq('starred', true);
  console.log(`Starred both Ch 4.2 decks for Hailey (upsert only). She now has ${stars.length} starred decks.`);
}
main().catch((e) => { console.error('FAILED:', e.message || e); process.exit(1); });
