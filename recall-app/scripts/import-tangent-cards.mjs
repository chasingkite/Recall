// Imports Hailey's "Math - Tangent Ratio (Ch 3.2)" deck for her Tuesday 10/13
// quiz: IM2 Chapter 3.2 Checkpoint, standard G-SRT.6 (tangent ONLY). Grounded in
// the teacher's actual Practice Quiz + Answer Key + Extra Practice (in
// ~/Documents/StudyMaterials/IM2/Class Canvas). Mirrors the teacher's method:
// tan(x)=opp/adj "slope fraction", degree mode, two solve-for-a-side cases
// (x on top: x=adj*tan; x on bottom: x=opp/tan), tree/shadow word problem, and
// the Morgan error-analysis trap. Per the card-design rules these are atomic
// concept/strategy/pattern cards — NOT multi-step solving. Enrichment called
// directly against Anthropic (dev-server outbound is sandbox-blocked). Run from
// recall-app/: node scripts/import-tangent-cards.mjs
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
const DECK_NAME = 'Math - Tangent Ratio (Ch 3.2)';
const TOPIC = 'tangent';

// For MC, `back` must EXACTLY match one of `choices`.
const CARDS = [
  { answerType: 'multiple-choice', front: "The tangent ratio uses which two sides of a right triangle?", back: 'Opposite and adjacent', choices: ['Opposite and adjacent', 'Opposite and hypotenuse', 'Adjacent and hypotenuse', 'All three sides'], explanation: "tan = opposite/adjacent — the two legs. The hypotenuse is NOT used. #1 mistake: grabbing the hypotenuse, which belongs to sine or cosine, not tangent." },
  { answerType: 'type', front: "Finish the tangent ratio as a fraction: tan(x) = opposite over ______", back: 'adjacent', explanation: "tan(x) = opposite / adjacent. Your teacher calls this the 'slope fraction' — rise over run." },
  { answerType: 'multiple-choice', front: "Your teacher calls tan(x) a 'slope fraction.' That's because the tangent equals —", back: 'rise over run (opposite over adjacent)', choices: ['rise over run (opposite over adjacent)', 'run over rise', 'hypotenuse over adjacent', 'opposite over hypotenuse'], explanation: "Slope = rise/run = vertical/horizontal = opposite/adjacent. Same idea as slope on a graph in algebra. #1 mistake: flipping it to run/rise (that would be 1/tan)." },
  { answerType: 'multiple-choice', front: "The side ACROSS from angle x is 4, and the side TOUCHING angle x (not the hypotenuse) is 8. What is tan(x) as a reduced fraction?", back: '1/2', choices: ['1/2', '2', '8/4', '2/1'], explanation: "tan(x) = opposite/adjacent = 4/8 = 1/2. Always reduce the slope fraction. #1 mistake: writing adjacent/opposite (8/4) by flipping the fraction." },
  { answerType: 'multiple-choice', front: "The side NEXT TO angle x (touching it, but not the hypotenuse) is called the —", back: 'adjacent side', choices: ['adjacent side', 'opposite side', 'hypotenuse', 'slope'], explanation: "'Adjacent' means next to / touching the angle. #1 mistake: swapping it with the opposite side — opposite is the one ACROSS from the angle." },
  { answerType: 'multiple-choice', front: "The side directly ACROSS from angle x is called the —", back: 'opposite side', choices: ['opposite side', 'adjacent side', 'hypotenuse', 'base'], explanation: "'Opposite' is across from the angle. For tangent, tan(x) = opposite/adjacent, so you must label these two correctly first." },
  { answerType: 'multiple-choice', front: "Before computing tan(37°) on your calculator, which mode MUST it be in?", back: 'Degree mode', choices: ['Degree mode', 'Radian mode', 'Gradian mode', 'Fraction mode'], explanation: "The quiz angles are in degrees, so the calculator must be in DEGREE mode. #1 mistake: leaving it in radians, which gives a completely wrong decimal (the key says 'make sure your calculator is in degrees')." },
  { answerType: 'multiple-choice', front: "You know the angle and the ADJACENT side; the unknown x is the OPPOSITE side (x on TOP). Which equation solves for x?", back: 'x = adjacent × tan(angle)', choices: ['x = adjacent × tan(angle)', 'x = adjacent ÷ tan(angle)', 'x = opposite × tan(angle)', 'x = tan(angle) ÷ adjacent'], explanation: "tan(angle) = x/adjacent, so multiply both sides by the adjacent side: x = adjacent·tan(angle). Example from the key: tan 27° = x/10 → x = 10·tan 27°. #1 mistake: dividing when x is already on top." },
  { answerType: 'multiple-choice', front: "You know the angle and the OPPOSITE side; the unknown x is the ADJACENT side (x on the BOTTOM). Which equation solves for x?", back: 'x = opposite ÷ tan(angle)', choices: ['x = opposite ÷ tan(angle)', 'x = opposite × tan(angle)', 'x = adjacent ÷ tan(angle)', 'x = tan(angle) ÷ opposite'], explanation: "tan(angle) = opposite/x → multiply by x then divide: x = opposite/tan(angle). Example from the key: tan 46° = 7/x → x = 7/tan 46°. #1 mistake: multiplying (opposite·tan) when x is on the bottom — that's Morgan's error." },
  { answerType: 'true-false', front: "True or False: For tan(22°) = 20/x (x in the denominator), you solve by writing x = 20 × tan(22°).", back: 'False', choices: ['True', 'False'], explanation: "FALSE — this is the #1 class mistake (Morgan's error). When x is on the BOTTOM you DIVIDE: x = 20 ÷ tan(22°). You only multiply when x is on top." },
  { answerType: 'multiple-choice', front: "Morgan solved tan(22°) = 20/x by writing x = 20 × tan(22°). What is the fix?", back: 'Divide instead: x = 20 ÷ tan(22°)', choices: ['Divide instead: x = 20 ÷ tan(22°)', 'Use sine instead of tangent', 'Switch to radian mode', 'Add 90° to the angle'], explanation: "Because x is in the denominator, you divide: x = 20/tan(22°) ≈ 49.50. Morgan's error was multiplying when x was on the bottom. #1 tip: if x is under the fraction bar, it ends up as a divisor." },
  { answerType: 'multiple-choice', front: "A tree's height is OPPOSITE the sun's angle and its shadow is ADJACENT. Which ratio connects the height and the shadow?", back: 'tangent', choices: ['tangent', 'sine', 'cosine', 'Pythagorean theorem'], explanation: "height(opposite)/shadow(adjacent) = tangent of the angle. Set up tan(angle) = height/shadow. #1 mistake: reaching for Pythagoras — you have an angle, so use tangent." },
  { answerType: 'type', front: "Shadow setup: a 19 ft tree casts a shadow of length x at a 23° angle. Fill the blank: tan(23°) = 19 / ______", back: 'x', explanation: "Tree height 19 is opposite the angle; shadow x is adjacent → tan 23° = 19/x, so x = 19/tan 23° ≈ 44.8 ft. Don't forget the units (feet)." },
  { answerType: 'multiple-choice', front: "As an acute angle grows from 14° toward 80°, its tangent value —", back: 'increases', choices: ['increases', 'decreases', 'stays the same', 'becomes negative'], explanation: "tan 14° ≈ 0.2493 grows to tan 80° ≈ 5.6713. The opposite side gets large compared to the adjacent. Use this as a sanity check: a big angle should give a big tangent." },
  { answerType: 'multiple-choice', front: "When finding tan(x) from a triangle, which side do you IGNORE?", back: 'the hypotenuse', choices: ['the hypotenuse', 'the opposite side', 'the adjacent side', 'the right-angle mark'], explanation: "Tangent uses only the two legs (opposite and adjacent). On the quiz, the √96 hypotenuse is a trap — tan(x) is still just 4/8 = 1/2. #1 mistake: using the hypotenuse in the fraction." },
  { answerType: 'type', front: "Finish the memory phrase for the tangent piece of SOH-CAH-TOA: TOA = Tangent, Opposite over ______", back: 'Adjacent', explanation: "TOA = Tangent → Opposite / Adjacent. The 'T-O-A' order tells you tangent is opposite over adjacent." },
  // ---- Inverse tangent (find the ANGLE) — taught 'last class' per the 3.2.4 notes (Millennium Tower) ----
  { answerType: 'multiple-choice', front: "You know BOTH legs (opposite and adjacent) and want to find the ANGLE. Which tool do you use?", back: 'Inverse tangent, tan⁻¹', choices: ['Inverse tangent, tan⁻¹', 'Tangent, tan', 'The Pythagorean theorem', 'Sine, sin'], explanation: "Plain tan turns an angle INTO a ratio; inverse tangent (tan⁻¹) turns the slope ratio BACK into the slope angle. #1 mistake: pressing tan instead of tan⁻¹ when you're hunting for the angle." },
  { answerType: 'multiple-choice', front: "If tan(θ) = 0.384 and you need the angle θ (the slope angle), you compute —", back: 'θ = tan⁻¹(0.384)', choices: ['θ = tan⁻¹(0.384)', 'θ = tan(0.384)', 'θ = 0.384 ÷ tan', 'θ = 1 ÷ 0.384'], explanation: "tan⁻¹ undoes tangent, so θ = tan⁻¹(0.384) ≈ 21° (matches the notes' table: tan 21° ≈ 0.384). Keep the calculator in degree mode." },
  { answerType: 'type', front: "Fill the blank: the 'slope ratio' is the tangent; the 'slope angle' is found with the ______ tangent function.", back: 'inverse', explanation: "Inverse tangent (tan⁻¹) converts the slope ratio back into the slope angle. It's the reverse of the tangent button." },
  { answerType: 'multiple-choice', front: "The Millennium Tower rises 573 ft over a 10 ft run, so its slope ratio is 57.3. To find its tilt ANGLE you compute —", back: 'tan⁻¹(57.3)', choices: ['tan⁻¹(57.3)', 'tan(57.3)', '57.3 × tan', '√(57.3)'], explanation: "Slope ratio → slope angle needs inverse tangent: tan⁻¹(57.3) ≈ 89°. Since 89° is above the 88° danger line, the tower is NOT in immediate danger. #1 mistake: using plain tan, which goes the wrong way." },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function enrichPrompt(card) {
  return `You are an educational content enricher for a 9th grade high school student's flashcard app. The student (Hailey) takes: Spanish 1, Biology, English 1, and Integrated Math 2. She's 14, lives in California, uses social media (TikTok, Instagram), plays sports, watches movies/shows, and cares about animals and the environment. These cards are for her Integrated Math 2 Chapter 3.2 quiz on the TANGENT RATIO (right triangles): tan = opposite/adjacent, and solving for a side.

Flashcard:
- Subject: ${card.subject}
- Front (question): ${card.front}
- Back (answer): ${card.back}

Generate these 5 fields as JSON. Keep language simple, conversational, and relatable to a freshman:

1. "tokConnection" - A "how do we actually know this?" question (1-2 sentences). Something a curious 14-year-old would wonder.
2. "interdisciplinary" - Connect to her OTHER classes specifically: Spanish 1, Biology, English 1, or Math 2 (1-2 sentences).
3. "inquiryQuestion" - A question that would spark debate with friends (1-2 sentences). No single right answer.
4. "realWorldConnection" - A specific example from her world: TikTok, Instagram, Netflix, sports, California weather, skateboard/bike ramps, phone, gaming, shopping, shadows at recess (1-2 sentences). Not generic.
5. "explanation" - Why the answer is correct in plain language (2-3 sentences). Mention the #1 mistake students make.

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
      topic: TOPIC,
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
  console.log(`\nInserted ${rows.length} cards (${JSON.stringify(byType)}), all topic='${TOPIC}'.`);
  console.log(`${enrichedCount}/${rows.length} fully enriched. Deck id: ${deckId}`);
}

main().catch((e) => { console.error('FAILED:', e.message || e); process.exit(1); });
