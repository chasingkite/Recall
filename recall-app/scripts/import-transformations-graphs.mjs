import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
const SUBJECT = 'math';
const DECK_NAME = 'Transformations — Graph Practice';

// ---- SVG coordinate-plane generator ----
const R = 8, S = 300, unit = S / (2 * R + 2), CX = S / 2, CY = S / 2;
const px = (x) => (CX + x * unit).toFixed(1);
const py = (y) => (CY - y * unit).toFixed(1);
function svgFor(spec) {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"><rect width="${S}" height="${S}" fill="#fff"/>`;
  for (let i = -R; i <= R; i++) {
    const c = i === 0 ? '#555' : '#e3e6ea', w = i === 0 ? 1.4 : 0.8;
    s += `<line x1="${px(i)}" y1="${py(-R)}" x2="${px(i)}" y2="${py(R)}" stroke="${c}" stroke-width="${w}"/>`;
    s += `<line x1="${px(-R)}" y1="${py(i)}" x2="${px(R)}" y2="${py(i)}" stroke="${c}" stroke-width="${w}"/>`;
  }
  for (let i = -R; i <= R; i += 2) {
    if (i === 0) continue;
    s += `<text x="${px(i)}" y="${(+py(0) + 10).toFixed(1)}" font-size="8" fill="#999" text-anchor="middle">${i}</text>`;
    s += `<text x="${(+px(0) - 9).toFixed(1)}" y="${(+py(i) + 3).toFixed(1)}" font-size="8" fill="#999" text-anchor="middle">${i}</text>`;
  }
  if (spec.line === 'y=x') s += `<line x1="${px(-R)}" y1="${py(-R)}" x2="${px(R)}" y2="${py(R)}" stroke="#8e8e93" stroke-width="1.3" stroke-dasharray="4 3"/>`;
  if (spec.line === 'y=-x') s += `<line x1="${px(-R)}" y1="${py(R)}" x2="${px(R)}" y2="${py(-R)}" stroke="#8e8e93" stroke-width="1.3" stroke-dasharray="4 3"/>`;
  for (const sh of spec.shapes) {
    const poly = sh.pts.map((p) => `${px(p[0])},${py(p[1])}`).join(' ');
    s += `<polygon points="${poly}" fill="none" stroke="${sh.color}" stroke-width="2"/>`;
    sh.pts.forEach((p, i) => {
      s += `<circle cx="${px(p[0])}" cy="${py(p[1])}" r="2.6" fill="${sh.color}"/>`;
      if (sh.labels && sh.labels[i]) s += `<text x="${(+px(p[0]) + 4).toFixed(1)}" y="${(+py(p[1]) - 4).toFixed(1)}" font-size="10" font-weight="700" fill="${sh.color}">${sh.labels[i]}</text>`;
    });
  }
  return s + `</svg>`;
}

const BLUE = '#007aff', PURPLE = '#af52de';
// ---- Cards ----
const CARDS = [
  { topic: 'reflection', file: 'tf-g1-reflect-xaxis.svg',
    shapes: [{ pts: [[1,2],[4,2],[1,5]], labels: ['A','B','C'], color: BLUE }],
    front: 'Triangle ABC (shown) is reflected across the x-axis. What are the coordinates of A′?',
    back: '(1, −2)', choices: ['(1, −2)', '(−1, 2)', '(2, 1)', '(1, 2)'],
    explanation: 'Reflecting across the x-axis flips the sign of y only: A(1, 2) → (1, −2). Choosing (−1, 2) flips x instead — that is the y-axis rule.' },
  { topic: 'reflection', file: 'tf-g2-reflect-yx.svg', line: 'y=x',
    shapes: [{ pts: [[2,1],[5,1],[2,3]], labels: ['P','Q','R'], color: BLUE }],
    front: 'Triangle PQR (shown) is reflected across the line y = x (dashed). What are the coordinates of R′?',
    back: '(3, 2)', choices: ['(3, 2)', '(2, 3)', '(−3, −2)', '(−2, −3)'],
    explanation: 'Across y = x you swap the coordinates: R(2, 3) → (3, 2). Picking (−3, −2) is the y = −x rule (swap AND negate both).' },
  { topic: 'rotation', file: 'tf-g3-rotate-90cw.svg',
    shapes: [{ pts: [[1,2],[4,2],[1,4]], labels: ['J','K','L'], color: BLUE }],
    front: 'Triangle JKL (shown) is rotated 90° clockwise about the origin. What are the coordinates of K′?',
    back: '(2, −4)', choices: ['(2, −4)', '(−2, 4)', '(4, −2)', '(−4, 2)'],
    explanation: '90° clockwise about the origin: (x, y) → (y, −x), so K(4, 2) → (2, −4). The trap (−2, 4) is the counterclockwise rule.' },
  { topic: 'dilation', file: 'tf-g4-dilate-k2.svg',
    shapes: [{ pts: [[1,1],[3,1],[1,2]], labels: ['A','B','C'], color: BLUE }],
    front: 'Triangle ABC (shown) is dilated by scale factor 2 centered at the origin. What are the coordinates of B′?',
    back: '(6, 2)', choices: ['(6, 2)', '(5, 3)', '(3, 2)', '(6, 1)'],
    explanation: 'Multiply BOTH coordinates by 2: B(3, 1) → (6, 2). The trap (6, 1) doubled only x — you must scale y too.' },
  { topic: 'dilation', file: 'tf-g5-scale-factor.svg',
    shapes: [{ pts: [[1,1],[2,1],[1,2]], labels: ['A','B','C'], color: BLUE }, { pts: [[3,3],[6,3],[3,6]], labels: ["A'","B'","C'"], color: PURPLE }],
    front: 'The larger triangle (purple) is the image of the smaller (blue) after a dilation centered at the origin. What is the scale factor?',
    back: '3', choices: ['3', '1/3', '2', '6'],
    explanation: 'k = image length ÷ original length = A′B′ (3) ÷ AB (1) = 3. Choosing 1/3 flips the ratio — since the image is larger, k must be greater than 1.' },
  { topic: 'reflection', file: 'tf-g6-find-line.svg',
    shapes: [{ pts: [[2,1],[4,1],[2,3]], labels: ['A','B','C'], color: BLUE }, { pts: [[-2,1],[-4,1],[-2,3]], labels: ["A'","B'","C'"], color: PURPLE }],
    front: 'A triangle (blue) and its image (purple) are shown. What is the line of reflection?',
    back: 'the y-axis (x = 0)', choices: ['the y-axis (x = 0)', 'the x-axis (y = 0)', 'y = x', 'y = −x'],
    explanation: 'The figures are left-right mirror images across the vertical axis, so the line of reflection is the y-axis (x = 0). The mirror line is the perpendicular bisector of each point-to-image segment.' },
  { topic: 'transformations_identify', file: 'tf-g7-translate.svg',
    shapes: [{ pts: [[-2,1],[1,1],[-2,4]], labels: ['A','B','C'], color: BLUE }],
    front: 'Triangle ABC (shown) is translated by (x, y) → (x + 4, y − 3). What are the coordinates of A′?',
    back: '(2, −2)', choices: ['(2, −2)', '(−6, 4)', '(2, 4)', '(−2, −2)'],
    explanation: 'Add 4 to x and subtract 3 from y: A(−2, 1) → (2, −2). Watch the signs — the figure moves right and down. (−6, 4) subtracts x and adds y (the reverse).' },
  { topic: 'composition', file: 'tf-g8-composition.svg',
    shapes: [{ pts: [[2,4],[4,4],[2,6]], labels: ['A','B','C'], color: BLUE }],
    front: 'Triangle ABC (shown) is dilated by 1/2 about the origin, then reflected across the x-axis. What are the coordinates of A′?',
    back: '(1, −2)', choices: ['(1, −2)', '(1, 2)', '(2, −4)', '(−1, 2)'],
    explanation: 'Do it in order. Dilate first: A(2, 4) → (1, 2). Then reflect across the x-axis (flip y): (1, 2) → (1, −2). The trap (1, 2) forgot the reflection step.' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function enrichPrompt(card) {
  return `You are an educational content enricher for a 9th grade high school student's flashcard app. The student takes: Spanish 1, Biology, English 1, and Integrated Math 2. She's 14, lives in California, uses social media (TikTok, Instagram), plays sports, watches movies/shows, and cares about animals and the environment.

Flashcard:
- Subject: ${card.subject}
- Front (question): ${card.front}
- Back (answer): ${card.back}

Generate these 5 fields as JSON. Keep language simple, conversational, and relatable to a freshman:

1. "tokConnection" - A "how do we actually know this?" question (1-2 sentences).
2. "interdisciplinary" - Connect to Spanish 1, Biology, English 1, or Math 2 (1-2 sentences).
3. "inquiryQuestion" - A question that would spark debate with friends (1-2 sentences).
4. "realWorldConnection" - A specific example from her world (1-2 sentences).
5. "explanation" - Why the answer is correct (2-3 sentences), mention the #1 mistake.

Respond with ONLY valid JSON, no markdown:
{"tokConnection": "...", "interdisciplinary": "...", "inquiryQuestion": "...", "realWorldConnection": "...", "explanation": "..."}`;
}
async function enrichCard(card) {
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 500, messages: [{ role: 'user', content: enrichPrompt({ ...card, subject: SUBJECT }) }] }),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) throw new Error(`anthropic ${res.status}`);
      const data = await res.json();
      let text = (data.content[0]?.text || '{}').replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const e = JSON.parse(text);
      return { real_world_connection: e.realWorldConnection || null, tok_connection: e.tokConnection || null, interdisciplinary: e.interdisciplinary || null, inquiry_question: e.inquiryQuestion || null };
    } catch (err) { lastErr = err; await sleep(1500 * attempt); }
  }
  throw lastErr;
}

async function main() {
  for (const c of CARDS) if (!c.choices.includes(c.back)) throw new Error(`back not in choices: ${c.front}`);

  // 1) Write SVGs
  for (const c of CARDS) {
    writeFileSync(`public/math/${c.file}`, svgFor(c));
  }
  console.log(`Wrote ${CARDS.length} SVGs to public/math/`);

  // 2) Dedup + deck
  const { data: existing } = await sb.from('cards').select('front, decks!inner(subject)').eq('decks.subject', SUBJECT);
  const existingFronts = new Set((existing || []).map((c) => c.front.toLowerCase().trim()));
  const fresh = CARDS.filter((c) => !existingFronts.has(c.front.toLowerCase().trim()));
  console.log(`Cards to import: ${fresh.length} (skipped ${CARDS.length - fresh.length})`);
  if (fresh.length === 0) return;

  let deckId;
  const { data: d } = await sb.from('decks').select('id').eq('name', DECK_NAME).eq('subject', SUBJECT).maybeSingle();
  if (d) { deckId = d.id; console.log('Reusing deck', deckId); }
  else { const { data: nd, error } = await sb.from('decks').insert({ name: DECK_NAME, subject: SUBJECT }).select().single(); if (error) throw error; deckId = nd.id; console.log('Created deck', deckId); }

  // 3) Enrich
  const enr = new Map();
  for (let i = 0; i < fresh.length; i += 3) {
    const batch = fresh.slice(i, i + 3);
    process.stdout.write(`Enriching ${i + 1}-${i + batch.length}/${fresh.length}... `);
    const rs = await Promise.allSettled(batch.map((c) => enrichCard(c)));
    rs.forEach((r, j) => { if (r.status === 'fulfilled') enr.set(batch[j].front, r.value); else console.log('fail', batch[j].file); });
    console.log('done'); await sleep(300);
  }

  // 4) Insert
  const rows = fresh.map((c) => {
    const e = enr.get(c.front) || {};
    return { deck_id: deckId, front: c.front, back: c.back, answer_type: 'multiple-choice', choices: c.choices, topic: c.topic,
      image_url: `/math/${c.file}`, explanation: c.explanation,
      real_world_connection: e.real_world_connection || null, tok_connection: e.tok_connection || null,
      interdisciplinary: e.interdisciplinary || null, inquiry_question: e.inquiry_question || null, audio_lang: 'en-US' };
  });
  const { error } = await sb.from('cards').insert(rows);
  if (error) throw error;
  console.log(`Inserted ${rows.length} graph cards with images. Enriched: ${rows.filter((r) => r.tok_connection).length}/${rows.length}.`);
}
main().catch((e) => { console.error('FAILED:', e.message || e); process.exit(1); });
