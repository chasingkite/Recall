// Imports Hailey's "Math - Right Triangle Trigonometry" deck for her current
// Integrated Math 2 unit (Ch 9: Right Triangles and Trigonometry — sin/cos/tan).
// Grounded in IM2 Ch09 §9.4 Tangent, §9.5 Sine & Cosine, §9.6 Solving Right
// Triangles (inverse trig), plus special right triangles, Pythagorean theorem,
// angle of elevation/depression, and the Pythagorean identity. Per the card-design
// rules these are atomic fact/pattern-recognition cards (SOH-CAH-TOA, special-angle
// values, which-ratio-to-pick) — NOT multi-step solving. Mostly multiple-choice.
// Enrichment called directly against Anthropic (dev-server outbound is sandbox-
// blocked). Mirrors import-english-shortstory-cards.mjs. Does NOT change
// deck_priorities. Run from recall-app/: node scripts/import-trig-cards.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')])
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
const SUBJECT = 'math';
const DECK_NAME = 'Math - Right Triangle Trigonometry';

// Authored cards. For MC, `back` must EXACTLY match one of `choices`.
const CARDS = [
  // ---- SOH-CAH-TOA: the three ratios ----
  { topic: 'trig_ratios', answerType: 'multiple-choice', front: "In SOH-CAH-TOA, which trig ratio equals opposite ÷ hypotenuse?", back: 'Sine (sin)', choices: ['Sine (sin)', 'Cosine (cos)', 'Tangent (tan)', 'Pythagorean theorem'], explanation: "SOH = Sine → Opposite over Hypotenuse. #1 mistake: swapping sine and cosine — both use the hypotenuse, but sine uses the OPPOSITE leg." },
  { topic: 'trig_ratios', answerType: 'multiple-choice', front: "Which trig ratio equals adjacent ÷ hypotenuse?", back: 'Cosine (cos)', choices: ['Cosine (cos)', 'Sine (sin)', 'Tangent (tan)', 'Secant'], explanation: "CAH = Cosine → Adjacent over Hypotenuse. #1 mistake: mixing up cos (adjacent/hyp) with sin (opposite/hyp)." },
  { topic: 'trig_ratios', answerType: 'multiple-choice', front: "Which trig ratio equals opposite ÷ adjacent (and uses NO hypotenuse)?", back: 'Tangent (tan)', choices: ['Tangent (tan)', 'Sine (sin)', 'Cosine (cos)', 'Cosecant'], explanation: "TOA = Tangent → Opposite over Adjacent. #1 mistake: thinking tangent uses the hypotenuse — it only uses the two legs." },
  { topic: 'trig_ratios', answerType: 'type', front: "Finish the memory trick for the trig ratios: SOH-CAH-___", back: 'TOA', explanation: "TOA = Tangent, Opposite, Adjacent. The three together: Sin=Opp/Hyp, Cos=Adj/Hyp, Tan=Opp/Adj." },
  // ---- Identifying sides ----
  { topic: 'trig_ratios', answerType: 'multiple-choice', front: "The side directly across from the right angle (the longest side) is the —", back: 'Hypotenuse', choices: ['Hypotenuse', 'Opposite leg', 'Adjacent leg', 'Base'], explanation: "The hypotenuse is always opposite the 90° angle and is the longest side. #1 mistake: calling a long-looking leg the hypotenuse — only the side across from the right angle qualifies." },
  { topic: 'trig_ratios', answerType: 'multiple-choice', front: "Relative to an acute angle, the leg that touches that angle (but isn't the hypotenuse) is the ___ leg.", back: 'Adjacent', choices: ['Adjacent', 'Opposite', 'Hypotenuse', 'Perpendicular'], explanation: "Adjacent = right next to the angle; opposite = across from it. #1 mistake: forgetting that 'opposite' and 'adjacent' switch depending on WHICH acute angle you're looking at." },
  // ---- Picking the right ratio (pattern recognition) ----
  { topic: 'trig_ratios', answerType: 'multiple-choice', front: "You know an acute angle and the side OPPOSITE it, and you want the HYPOTENUSE. Which ratio should you set up?", back: 'Sine', choices: ['Sine', 'Cosine', 'Tangent', 'Pythagorean theorem'], explanation: "Opposite + hypotenuse → sine (SOH). #1 mistake: reaching for the Pythagorean theorem — that needs two sides, not a side and an angle." },
  { topic: 'trig_ratios', answerType: 'multiple-choice', front: "You know an acute angle and want to relate the two LEGS (opposite and adjacent). Which ratio?", back: 'Tangent', choices: ['Tangent', 'Sine', 'Cosine', 'Pythagorean theorem'], explanation: "Two legs, no hypotenuse → tangent (TOA). #1 mistake: using sine or cosine, which both require the hypotenuse." },
  // ---- Pythagorean theorem ----
  { topic: 'pythagorean', answerType: 'multiple-choice', front: "For a right triangle with legs a and b and hypotenuse c, the Pythagorean Theorem is —", back: 'a² + b² = c²', choices: ['a² + b² = c²', 'a + b = c', 'a² − b² = c²', '2a + 2b = c'], explanation: "The squares of the two legs add up to the square of the hypotenuse. #1 mistake: squaring the sum (a+b)² instead of adding the separate squares a² + b²." },
  // ---- Special right triangles ----
  { topic: 'special_triangles', answerType: 'multiple-choice', front: "In a 45°-45°-90° triangle, the ratio of sides (leg : leg : hypotenuse) is —", back: '1 : 1 : √2', choices: ['1 : 1 : √2', '1 : √3 : 2', '1 : 2 : 3', '3 : 4 : 5'], explanation: "The two legs are equal, and the hypotenuse is a leg times √2. #1 mistake: confusing it with the 30-60-90 ratio." },
  { topic: 'special_triangles', answerType: 'multiple-choice', front: "In a 30°-60°-90° triangle, the ratio (short leg : long leg : hypotenuse) is —", back: '1 : √3 : 2', choices: ['1 : √3 : 2', '1 : 1 : √2', '1 : 2 : √3', '2 : 3 : 4'], explanation: "Short leg (opposite 30°) = 1, long leg = short·√3, hypotenuse = short·2. #1 mistake: putting √3 as the hypotenuse — the hypotenuse is the 2." },
  { topic: 'special_triangles', answerType: 'multiple-choice', front: "What is sin 30°?", back: '1/2', choices: ['1/2', '√3/2', '√2/2', '1'], explanation: "In a 30-60-90 triangle (1, √3, 2), sin 30° = opposite/hypotenuse = 1/2 = 0.5. #1 mistake: mixing it up with cos 30° = √3/2." },
  { topic: 'special_triangles', answerType: 'multiple-choice', front: "What is cos 30°?", back: '√3/2', choices: ['√3/2', '1/2', '√2/2', '√3'], explanation: "cos 30° = adjacent/hypotenuse = √3/2 ≈ 0.866. #1 mistake: swapping with sin 30° = 1/2." },
  { topic: 'special_triangles', answerType: 'multiple-choice', front: "What is cos 60°?", back: '1/2', choices: ['1/2', '√3/2', '√2/2', '√3'], explanation: "cos 60° = 1/2. Notice sin 30° = cos 60° — an angle's sine equals its complement's cosine (30° and 60° are complements)." },
  { topic: 'special_triangles', answerType: 'multiple-choice', front: "What is sin 45° (which equals cos 45°)?", back: '√2/2 ≈ 0.7071', choices: ['√2/2 ≈ 0.7071', '1/2', '√3/2', '1'], explanation: "In a 45-45-90 triangle (1, 1, √2), sin 45° = 1/√2 = √2/2 ≈ 0.7071. #1 mistake: leaving it as 1/√2 without rationalizing to √2/2." },
  { topic: 'special_triangles', answerType: 'multiple-choice', front: "What is tan 45°?", back: '1', choices: ['1', '0', '√3', '√2/2'], explanation: "In a 45-45-90 triangle the two legs are equal, so tan 45° = opposite/adjacent = 1. #1 mistake: guessing √2/2 — that's sin 45° and cos 45°, not the tangent." },
  { topic: 'special_triangles', answerType: 'multiple-choice', front: "What is tan 60°?", back: '√3 ≈ 1.732', choices: ['√3 ≈ 1.732', '1/2', '√3/2', '1'], explanation: "In a 30-60-90 triangle, tan 60° = long leg/short leg = √3/1 = √3 ≈ 1.732. #1 mistake: using √3/2, which is cos 30°, not tan 60°." },
  // ---- Inverse trig: finding angles ----
  { topic: 'inverse_trig', answerType: 'multiple-choice', front: "You know two side lengths of a right triangle and want to find a missing ANGLE. What do you use?", back: 'An inverse trig ratio (sin⁻¹, cos⁻¹, or tan⁻¹)', choices: ['An inverse trig ratio (sin⁻¹, cos⁻¹, or tan⁻¹)', 'A regular trig ratio (sin, cos, tan)', 'The Pythagorean theorem', 'The distance formula'], explanation: "Inverse trig turns a side ratio back into the angle. #1 mistake: using plain sin/cos/tan — those take an angle and give a ratio, which is the reverse of what you need." },
  { topic: 'inverse_trig', answerType: 'multiple-choice', front: "If tan A = (opposite/adjacent), which operation finds the angle A from that ratio?", back: 'tan⁻¹ (inverse tangent)', choices: ['tan⁻¹ (inverse tangent)', 'tan', 'cos⁻¹ (inverse cosine)', 'squaring the ratio'], explanation: "tan⁻¹(ratio) = the angle. #1 mistake: pressing 'tan' instead of 'tan⁻¹' — that goes the wrong direction." },
  { topic: 'inverse_trig', answerType: 'type', front: "Fill in the word: To find an unknown ANGLE when you know two sides, use a(n) ___ trig ratio (sin⁻¹, cos⁻¹, tan⁻¹).", back: 'inverse', explanation: "Inverse (also called 'arc') trig ratios return an angle from a side ratio." },
  // ---- Angle of elevation / depression ----
  { topic: 'elevation_depression', answerType: 'multiple-choice', front: "The angle your line of sight makes with the horizontal when you look UP at something is the —", back: 'Angle of elevation', choices: ['Angle of elevation', 'Angle of depression', 'Reflex angle', 'Complementary angle'], explanation: "Look UP → angle of ELEVATION. #1 mistake: swapping it with angle of depression (which is looking down)." },
  { topic: 'elevation_depression', answerType: 'multiple-choice', front: "The angle your line of sight makes with the horizontal when you look DOWN at something is the —", back: 'Angle of depression', choices: ['Angle of depression', 'Angle of elevation', 'Vertical angle', 'Supplementary angle'], explanation: "Look DOWN → angle of DEPRESSION. #1 mistake: these two are mirror images and easy to flip — 'depression' literally means pressed down." },
  // ---- Relationships / identity ----
  { topic: 'trig_identity', answerType: 'true-false', front: "True or False: For any acute angle θ, sin²θ + cos²θ = 1.", back: 'True', choices: ['True', 'False'], explanation: "True — this is the Pythagorean identity, coming from x² + y² = 1 on the unit circle. #1 mistake: writing sin θ + cos θ = 1 (you must SQUARE each term)." },
  { topic: 'trig_identity', answerType: 'multiple-choice', front: "The tangent of an angle can be rewritten as which ratio of the other two?", back: 'sin θ ÷ cos θ', choices: ['sin θ ÷ cos θ', 'cos θ ÷ sin θ', 'sin θ × cos θ', '1 − cos θ'], explanation: "tan θ = (y/x) = sin θ / cos θ. #1 mistake: flipping it to cos/sin, which is actually cotangent." },
  { topic: 'trig_identity', answerType: 'multiple-choice', front: "The sine of an acute angle equals the cosine of its —", back: 'Complement (90° − the angle)', choices: ['Complement (90° − the angle)', 'Supplement (180° − the angle)', 'Opposite', 'Double'], explanation: "sin A = cos(90° − A). For example, sin 56° = cos 34°. #1 mistake: using the supplement (180° −) instead of the complement (90° −)." },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function enrichPrompt(card) {
  return `You are an educational content enricher for a 9th grade high school student's flashcard app. The student takes: Spanish 1, Biology, English 1, and Integrated Math 2. She's 14, lives in California, uses social media (TikTok, Instagram), plays sports, watches movies/shows, and cares about animals and the environment. These cards are for her Integrated Math 2 unit on right-triangle trigonometry (sin, cos, tan).

Flashcard:
- Subject: ${card.subject}
- Front (question): ${card.front}
- Back (answer): ${card.back}

Generate these 5 fields as JSON. Keep language simple, conversational, and relatable to a freshman:

1. "tokConnection" - A "how do we actually know this?" question (1-2 sentences). Don't be overly philosophical. Make it something a curious 14-year-old would wonder.

2. "interdisciplinary" - Connect to her OTHER classes specifically: Spanish 1, Biology, English 1, or Math 2 (1-2 sentences). Show how this concept appears in a totally different subject she's actually taking.

3. "inquiryQuestion" - A question that would spark debate with friends (1-2 sentences). No single right answer.

4. "realWorldConnection" - A specific example from her world: TikTok trends, Instagram, Netflix shows, school lunch, sports practice, California weather, her phone, gaming, skateboarding ramps, or shopping (1-2 sentences). Not generic.

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
  const { data: existing } = await sb.from('cards').select('front, decks!inner(subject)').eq('decks.subject', SUBJECT);
  const existingFronts = new Set((existing || []).map((c) => c.front.toLowerCase().trim()));
  const fresh = CARDS.filter((c) => !existingFronts.has(c.front.toLowerCase().trim()));
  console.log(`Cards to import: ${fresh.length} (skipped ${CARDS.length - fresh.length} duplicates)`);
  if (fresh.length === 0) return;

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

  const enriched = new Map();
  for (let i = 0; i < fresh.length; i += 3) {
    const batch = fresh.slice(i, i + 3);
    process.stdout.write(`Enriching ${i + 1}-${i + batch.length}/${fresh.length}... `);
    const results = await Promise.allSettled(batch.map((c) => enrichCard(c)));
    results.forEach((r, j) => {
      if (r.status === 'fulfilled') enriched.set(batch[j].front, r.value);
      else console.log(`\n  (enrich failed "${batch[j].front.slice(0, 30)}...": ${r.reason?.message || r.reason})`);
    });
    console.log('done');
    await sleep(300);
  }

  const rows = fresh.map((c) => {
    const enr = enriched.get(c.front) || {};
    return {
      deck_id: deckId,
      front: c.front,
      back: c.back,
      answer_type: c.answerType,
      choices: c.choices || null,
      topic: c.topic,
      explanation: c.explanation,
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
  const byType = rows.reduce((m, r) => ((m[r.answer_type] = (m[r.answer_type] || 0) + 1), m), {});
  const byTopic = rows.reduce((m, r) => ((m[r.topic] = (m[r.topic] || 0) + 1), m), {});
  console.log(`\nInserted ${rows.length} cards (${JSON.stringify(byType)}).`);
  console.log(`Topics: ${JSON.stringify(byTopic)}`);
  console.log(`${enrichedCount}/${rows.length} fully enriched.`);
}

main().catch((e) => { console.error('FAILED:', e.message || e); process.exit(1); });
