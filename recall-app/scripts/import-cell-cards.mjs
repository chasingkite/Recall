// Creates the "Biology - Cells" deck for Hailey (animal cell, plant cell, prokaryote vs
// eukaryote) with labeled-diagram cards, enriches via Anthropic DIRECTLY (dev-server
// outbound is sandbox-blocked), and stars the deck for her.
//
// Default is a DRY RUN: verifies cards against the SVGs and prints a summary, writes nothing.
// Run from recall-app/:
//   node scripts/generate-cell-svgs.mjs        # once, creates public/bio/*.svg
//   node scripts/import-cell-cards.mjs         # dry run / verification
//   node scripts/import-cell-cards.mjs --apply # insert deck + cards, star for Hailey
// Only --apply AFTER the SVGs are deployed (image_url points at /bio/*.svg).
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');
const DECK_NAME = 'Biology - Cells';
const SUBJECT = 'biology';
const ADMIN = 'be2522d5-b953-4fa3-9920-6cb787c14ca7';
const HAILEY = 'be5c10f0-adf1-4a14-90ba-19b16b250e14';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- cards -------------------------------------------------------------------
// Diagram cards set `svg` + `pin`; their `back` must equal the SVG's data-organelle for
// that pin (verified below). true-false: front = statement, back = "true"/"false".
// fill-blank: front contains ___, back = the missing word.
const ANIMAL = 'animal_cell', PLANT = 'plant_cell', PE = 'prokaryote_eukaryote';
const mc = (topic, front, back, wrong, extra = {}) => ({
  topic, front, back, answer_type: 'multiple-choice', choices: [back, ...wrong], ...extra,
});
const CARDS = [
  // ---- animal cell: diagram ----
  mc(ANIMAL, 'Which organelle is labeled A in this animal cell?', 'Nucleus', ['Mitochondrion', 'Ribosomes', 'Cytoplasm'], { svg: 'cell-animal.svg', pin: 'A' }),
  mc(ANIMAL, 'Which organelle is labeled B in this animal cell?', 'Mitochondrion', ['Nucleus', 'Ribosomes', 'Cell membrane'], { svg: 'cell-animal.svg', pin: 'B' }),
  mc(ANIMAL, 'The tiny dots labeled C make proteins. What are they called?', 'Ribosomes', ['Mitochondria', 'Nuclei', 'Vacuoles'], { svg: 'cell-animal.svg', pin: 'C' }),
  { topic: ANIMAL, front: 'What is the outer boundary of this animal cell, labeled D?', back: 'Cell membrane', answer_type: 'type', svg: 'cell-animal.svg', pin: 'D' },
  { topic: ANIMAL, front: 'What is the jelly-like fluid inside the cell, labeled E?', back: 'Cytoplasm', answer_type: 'type', svg: 'cell-animal.svg', pin: 'E' },
  // ---- animal cell: text ----
  { topic: ANIMAL, front: "Which organelle holds the cell's DNA and controls the cell's activities?", back: 'Nucleus', answer_type: 'type' },
  mc(ANIMAL, 'Which organelle releases energy from glucose for the cell to use?', 'Mitochondrion', ['Nucleus', 'Ribosome', 'Cell membrane']),
  { topic: ANIMAL, front: 'What is the job of ribosomes?', back: 'Make proteins', answer_type: 'type' },
  { topic: ANIMAL, front: 'The cell membrane controls what ___ and leaves the cell.', back: 'enters', answer_type: 'fill-blank' },
  { topic: ANIMAL, front: 'The cytoplasm is the jelly-like fluid where many of the cell\'s chemical reactions happen.', back: 'true', answer_type: 'true-false' },
  { topic: ANIMAL, front: 'Muscle cells need lots of energy. Which organelle would you expect MORE of in a muscle cell?', back: 'Mitochondria', answer_type: 'type' },

  // ---- plant cell: diagram ----
  mc(PLANT, 'Which structure is labeled A in this plant cell?', 'Cell wall', ['Cell membrane', 'Cytoplasm', 'Nucleus'], { svg: 'cell-plant.svg', pin: 'A' }),
  mc(PLANT, 'Which structure is labeled B in this plant cell? (It is just inside the wall.)', 'Cell membrane', ['Cell wall', 'Large central vacuole', 'Chloroplast'], { svg: 'cell-plant.svg', pin: 'B' }),
  mc(PLANT, 'Which organelle is labeled C in this plant cell?', 'Nucleus', ['Chloroplast', 'Mitochondrion', 'Large central vacuole'], { svg: 'cell-plant.svg', pin: 'C' }),
  mc(PLANT, 'The green organelle labeled D carries out photosynthesis. What is it?', 'Chloroplast', ['Mitochondrion', 'Nucleus', 'Large central vacuole'], { svg: 'cell-plant.svg', pin: 'D' }),
  mc(PLANT, 'Which structure is the big water-filled space labeled E?', 'Large central vacuole', ['Nucleus', 'Chloroplast', 'Cytoplasm'], { svg: 'cell-plant.svg', pin: 'E' }),
  mc(PLANT, 'Which organelle is labeled F in this plant cell?', 'Mitochondrion', ['Chloroplast', 'Nucleus', 'Cell wall'], { svg: 'cell-plant.svg', pin: 'F' }),
  // ---- plant cell: text ----
  mc(PLANT, 'Which structure gives a plant cell its rigid, fixed shape?', 'Cell wall', ['Cell membrane', 'Cytoplasm', 'Nucleus']),
  { topic: PLANT, front: 'What material makes up the plant cell wall?', back: 'Cellulose', answer_type: 'type' },
  { topic: PLANT, front: 'What is the job of the chloroplast?', back: 'Photosynthesis', answer_type: 'type' },
  { topic: PLANT, front: 'Animal cells have chloroplasts.', back: 'false', answer_type: 'true-false' },
  mc(PLANT, 'Which pair of structures is found in plant cells but NOT in animal cells?', 'Cell wall and chloroplasts', ['Nucleus and mitochondria', 'Cell membrane and cytoplasm', 'Ribosomes and nucleus']),
  { topic: PLANT, front: 'The large central ___ stores water and helps keep a plant cell firm.', back: 'vacuole', answer_type: 'fill-blank' },
  mc(PLANT, 'Which cell is MORE likely to contain many chloroplasts: a leaf cell or a root cell?', 'Leaf cell', ['Root cell', 'Both equally', 'Neither']),

  // ---- prokaryote vs eukaryote: diagram (bacterium) ----
  mc(PE, 'Which structure is labeled A on this bacterium?', 'Cell wall', ['Nucleoid', 'Plasmid', 'Flagellum'], { svg: 'cell-bacterium.svg', pin: 'A' }),
  mc(PE, "This bacterium has no nucleus. What is the loose tangle of DNA labeled B called?", 'Nucleoid', ['Plasmid', 'Flagellum', 'Cell wall'], { svg: 'cell-bacterium.svg', pin: 'B' }),
  mc(PE, 'What is the small, separate ring of DNA labeled C?', 'Plasmid', ['Nucleoid', 'Flagellum', 'Cell wall'], { svg: 'cell-bacterium.svg', pin: 'C' }),
  mc(PE, 'Which structure labeled D lets this bacterium swim?', 'Flagellum', ['Plasmid', 'Nucleoid', 'Cell wall'], { svg: 'cell-bacterium.svg', pin: 'D' }),
  // ---- prokaryote vs eukaryote: text ----
  mc(PE, "Which type of cell has NO nucleus — its DNA floats freely in the cytoplasm?", 'Prokaryotic cell', ['Eukaryotic cell', 'Plant cell', 'Animal cell']),
  { topic: PE, front: 'Eukaryotic cells keep their DNA inside which structure?', back: 'Nucleus', answer_type: 'type' },
  { topic: PE, front: 'Bacteria are eukaryotes.', back: 'false', answer_type: 'true-false' },
  mc(PE, 'Which of these is made of eukaryotic cells?', 'Oak tree', ['E. coli bacterium', 'Salmonella bacterium', 'Any bacterium']),
  { topic: PE, front: 'Fungi, plants, and animals are all made of eukaryotic cells.', back: 'true', answer_type: 'true-false' },
  mc(PE, 'Mitochondria, chloroplasts, and the nucleus are all examples of what, found in eukaryotic cells but NOT prokaryotic cells?', 'Membrane-bound organelles', ['Cell walls', 'Ribosomes', 'Flagella']),
  mc(PE, 'Which is typically larger: a prokaryotic cell or a eukaryotic cell?', 'Eukaryotic cell', ['Prokaryotic cell', 'They are the same size', 'It depends on the nucleus']),
  { topic: PE, front: 'Prokaryotes have no membrane-bound ___, including no nucleus.', back: 'organelles', answer_type: 'fill-blank' },
  { topic: PE, front: 'Both prokaryotic and eukaryotic cells have ribosomes.', back: 'true', answer_type: 'true-false' },
];

// ---- verification (no network) ------------------------------------------------
function loadPins(svgFile) {
  const svg = readFileSync(`public/bio/${svgFile}`, 'utf8');
  const pins = {};
  for (const m of svg.matchAll(/data-pin="([^"]+)" data-organelle="([^"]+)"/g)) pins[m[1]] = m[2];
  return pins;
}
function verify() {
  const errors = [];
  const fronts = new Set();
  const pinCache = {};
  const usedPins = new Set();
  for (const c of CARDS) {
    const id = `"${c.front.slice(0, 50)}"`;
    if (fronts.has(c.front.toLowerCase())) errors.push(`duplicate front: ${id}`);
    fronts.add(c.front.toLowerCase());
    if (c.answer_type === 'multiple-choice') {
      if (!c.choices.includes(c.back)) errors.push(`MC answer not in choices: ${id}`);
      if (new Set(c.choices).size !== c.choices.length) errors.push(`MC duplicate choices: ${id}`);
      if (c.choices.length !== 4) errors.push(`MC should have 4 choices: ${id}`);
    }
    if (c.answer_type === 'true-false' && !['true', 'false'].includes(c.back)) errors.push(`T/F back must be true|false: ${id}`);
    if (c.answer_type === 'fill-blank' && !c.front.includes('___')) errors.push(`fill-blank missing ___: ${id}`);
    if (c.svg) {
      pinCache[c.svg] ||= loadPins(c.svg);
      const organelle = pinCache[c.svg][c.pin];
      if (!organelle) errors.push(`pin ${c.pin} not in ${c.svg}: ${id}`);
      else if (organelle.toLowerCase() !== c.back.toLowerCase()) errors.push(`pin ${c.pin} in ${c.svg} is "${organelle}" but card answer is "${c.back}"`);
      usedPins.add(`${c.svg}:${c.pin}`);
    }
  }
  for (const [file, pins] of Object.entries(pinCache))
    for (const p of Object.keys(pins)) if (!usedPins.has(`${file}:${p}`)) errors.push(`pin ${p} in ${file} has no card`);
  return errors;
}

// ---- enrichment ---------------------------------------------------------------
function enrichPrompt(card) {
  const answer = card.answer_type === 'multiple-choice' ? `${card.back} (choices: ${card.choices.join(' / ')})` : card.back;
  return `You are creating learning enrichment for a 9th-grade student (Hailey, 14) studying Biology (cells).

Flashcard:
- Subject: biology
- Front (question): ${card.front}${card.pin ? ` [a labeled diagram is shown; pin ${card.pin}]` : ''}
- Back (answer): ${answer}

Generate these 5 fields as JSON. Keep language simple, conversational, and relatable to a freshman:

1. "tokConnection" - A "how do we actually know this?" question (1-2 sentences). Something a curious 14-year-old would wonder (e.g. microscopes, evidence).
2. "interdisciplinary" - Connect to her OTHER classes: Spanish 1, English 1, Math 2, or PE (1-2 sentences).
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
      const out = {
        explanation: e.explanation, real_world_connection: e.realWorldConnection, tok_connection: e.tokConnection,
        interdisciplinary: e.interdisciplinary, inquiry_question: e.inquiryQuestion,
      };
      if (Object.values(out).some((v) => !v)) throw new Error('missing enrichment field');
      return out;
    } catch (err) {
      lastErr = err;
      await sleep(1500 * attempt);
    }
  }
  throw lastErr;
}

// ---- main ---------------------------------------------------------------------
const errors = verify();
const byTopic = {};
for (const c of CARDS) byTopic[c.topic] = (byTopic[c.topic] || 0) + 1;
console.log(`${CARDS.length} cards:`, byTopic, `| diagram cards: ${CARDS.filter((c) => c.svg).length}`);
if (errors.length) {
  console.error('VERIFICATION FAILED:\n  ' + errors.join('\n  '));
  process.exit(1);
}
console.log('Verification OK (answers match SVG pins, MC answers in choices, no duplicates, every pin used).');
if (!APPLY) {
  console.log('Dry run — nothing written. Re-run with --apply after the SVGs are deployed.');
  process.exit(0);
}

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')])
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  let { data: deck } = await sb.from('decks').select('id').eq('name', DECK_NAME).eq('subject', SUBJECT).maybeSingle();
  if (!deck) {
    const { data, error } = await sb.from('decks').insert({ name: DECK_NAME, subject: SUBJECT, created_by: ADMIN, shared: true }).select('id').single();
    if (error) throw error;
    deck = data;
    console.log(`Created deck ${DECK_NAME} (${deck.id})`);
  } else console.log(`Reusing deck ${DECK_NAME} (${deck.id})`);

  const { data: existing } = await sb.from('cards').select('front').eq('deck_id', deck.id);
  const have = new Set((existing || []).map((c) => c.front.toLowerCase().trim()));
  const fresh = CARDS.filter((c) => !have.has(c.front.toLowerCase().trim()));
  console.log(`Cards to insert: ${fresh.length} (skipping ${CARDS.length - fresh.length} already present)`);

  const rows = [];
  for (let i = 0; i < fresh.length; i += 3) {
    const batch = fresh.slice(i, i + 3);
    process.stdout.write(`Enriching ${i + 1}-${i + batch.length}/${fresh.length}... `);
    const results = await Promise.allSettled(batch.map((c) => enrichCard(c, env.ANTHROPIC_API_KEY)));
    results.forEach((r, j) => {
      const c = batch[j];
      if (r.status === 'rejected') console.log(`\n  (enrich failed "${c.front.slice(0, 40)}": ${r.reason?.message || r.reason})`);
      const e = r.status === 'fulfilled' ? r.value : {};
      rows.push({
        deck_id: deck.id, front: c.front, back: c.back, answer_type: c.answer_type, choices: c.choices || null,
        topic: c.topic, image_url: c.svg ? `/bio/${c.svg}` : null, audio_lang: 'en-US',
        explanation: e.explanation || '', real_world_connection: e.real_world_connection || '',
        tok_connection: e.tok_connection || '', interdisciplinary: e.interdisciplinary || '', inquiry_question: e.inquiry_question || '',
      });
    });
    console.log('done');
    await sleep(300);
  }
  if (rows.length) {
    const { error } = await sb.from('cards').insert(rows);
    if (error) throw error;
    console.log(`Inserted ${rows.length} cards (${rows.filter((r) => r.tok_connection).length} fully enriched).`);
  }

  // Star for Hailey — upsert only; does NOT clear her other stars.
  const { error: starErr } = await sb.from('deck_priorities').upsert({ user_id: HAILEY, deck_id: deck.id, starred: true }, { onConflict: 'user_id,deck_id' });
  if (starErr) throw starErr;
  const { data: stars } = await sb.from('deck_priorities').select('deck_id').eq('user_id', HAILEY).eq('starred', true);
  console.log(`Starred ${DECK_NAME} for Hailey. She now has ${stars.length} starred decks.`);
}
main().catch((e) => { console.error('FAILED:', e.message || e); process.exit(1); });
