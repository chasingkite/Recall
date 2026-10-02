// Imports Hailey's "English - Of Mice and Men" deck (John Steinbeck novel study):
// vocabulary (contextual use) + reading comprehension (characters, plot, theme,
// symbolism/foreshadowing, title allusion). English 1 is her weakest grade
// (C+ 77.66%), so this targets that class. Mostly multiple-choice (matches her
// online tests) with some type-in and true/false for variety. Enrichment called
// directly against Anthropic (dev-server outbound is sandbox-blocked). Mirrors
// import-english-shortstory-cards.mjs. Does NOT change deck_priorities (steering
// left as-is). Run from recall-app/: node scripts/import-mice-and-men-cards.mjs
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
const SUBJECT = 'english';
const DECK_NAME = 'English - Of Mice and Men';

// Authored cards. For MC, `back` must be one of `choices`. `explanation` is
// authored + trap-specific (wins over AI). Answer types: multiple-choice / type / true-false.
const CARDS = [
  // ================= VOCABULARY (contextual use) =================
  { topic: 'vocab', answerType: 'multiple-choice', front: "George and Lennie each carry a BINDLE down the road. A bindle is —", back: 'A bundle of belongings tied in a blanket', choices: ['A bundle of belongings tied in a blanket', 'A type of rifle', 'A railroad ticket', 'A card game'], explanation: "A bindle is the roll of possessions a migrant worker carries. #1 mistake: guessing it's a weapon because the men later handle a gun — the bindle is just their luggage." },
  { topic: 'vocab', answerType: 'multiple-choice', front: "Crooks keeps to himself in the harness room, staying ALOOF from the other men. Aloof means —", back: 'Distant and uninvolved', choices: ['Distant and uninvolved', 'Friendly and talkative', 'Angry and violent', 'Confused and lost'], explanation: "Aloof = keeping emotional/physical distance. #1 mistake: assuming it means 'angry' — Crooks isn't raging, he's holding himself apart." },
  { topic: 'vocab', answerType: 'multiple-choice', front: "Lennie felt APPREHENSIVE that George would find out about the dead mouse. Apprehensive means —", back: 'Anxious or uneasy about what might happen', choices: ['Anxious or uneasy about what might happen', 'Excited and eager', 'Bored and sleepy', 'Proud and confident'], explanation: "Apprehensive = nervous about a possible bad outcome. #1 mistake: confusing it with 'eager' — it's a worried feeling, not an excited one." },
  { topic: 'vocab', answerType: 'multiple-choice', front: "Curley speaks to Lennie in a CONTEMPTUOUS tone. Contemptuous means —", back: 'Showing scorn, as if someone is beneath you', choices: ['Showing scorn, as if someone is beneath you', 'Showing deep respect', 'Showing fear', 'Showing joy'], explanation: "Contempt is looking down on someone. #1 mistake: flipping it to 'respect' — contemptuous is the opposite of admiring." },
  { topic: 'vocab', answerType: 'multiple-choice', front: "Slim's calm words MOLLIFIED the angry men. To mollify someone is to —", back: 'Calm or soothe their anger', choices: ['Calm or soothe their anger', 'Make them angrier', 'Ignore them completely', 'Trick them'], explanation: "Mollify = to pacify or soothe. #1 mistake: picking 'make angrier' — the root feels like 'mollify ≈ mellow,' which points to calming down." },
  { topic: 'vocab', answerType: 'multiple-choice', front: "After his dog is shot, Candy lies on his bunk, MOROSE and silent. Morose means —", back: 'Gloomy and sullen', choices: ['Gloomy and sullen', 'Cheerful and lively', 'Curious and alert', 'Calm and content'], explanation: "Morose = deeply gloomy. #1 mistake: context tells you Candy just lost his dog, so a 'cheerful' answer can't fit the mood." },
  { topic: 'vocab', answerType: 'type', front: "Fill in the word: The dead mouse and the shot dog are ___ signs — they hint that something bad is coming. (adjective meaning 'threatening')", back: 'ominous', explanation: "Ominous = giving the sense that something bad will happen. Context clue: it describes warning signs of future harm." },
  { topic: 'vocab', answerType: 'multiple-choice', front: "Lennie goes through the PANTOMIME of searching his pockets to hide the mouse. A pantomime is —", back: 'Acting something out with gestures and no words', choices: ['Acting something out with gestures and no words', 'A loud argument', 'A written confession', 'A short song'], explanation: "Pantomime = silent acting using movement. #1 mistake: thinking it involves speech — the whole point is that it's wordless." },
  { topic: 'vocab', answerType: 'multiple-choice', front: "Curley is described as PUGNACIOUS, always itching to prove himself. Pugnacious means —", back: 'Eager to fight or argue', choices: ['Eager to fight or argue', 'Shy and gentle', 'Lazy and slow', 'Generous and kind'], explanation: "Pugnacious = combative (same root as 'pugilist,' a boxer). #1 mistake: picking a gentle meaning — Curley literally picks fights." },
  { topic: 'vocab', answerType: 'multiple-choice', front: "Crooks speaks SKEPTICALLY about the dream farm ever happening. To be skeptical is to be —", back: 'Doubtful that something is true', choices: ['Doubtful that something is true', 'Completely certain', 'Overjoyed', 'Terrified'], explanation: "Skeptical = full of doubt. #1 mistake: choosing 'certain' — a skeptic withholds belief, they don't fully commit either way." },
  { topic: 'vocab', answerType: 'multiple-choice', front: "Lennie walks with a heavy, LUMBERING gait, 'the way a bear drags his paws.' Lumbering means —", back: 'Moving in a slow, heavy, clumsy way', choices: ['Moving in a slow, heavy, clumsy way', 'Moving quickly and lightly', 'Standing perfectly still', 'Chopping wood'], explanation: "Lumbering = heavy, awkward movement. #1 mistake: linking it to 'lumber/wood' — here it describes HOW someone moves, like Lennie's bear-like walk." },

  // ================= READING COMPREHENSION =================
  // ---- Author / title ----
  { topic: 'author', answerType: 'multiple-choice', front: "Who wrote the novel Of Mice and Men?", back: 'John Steinbeck', choices: ['John Steinbeck', 'Mark Twain', 'Harper Lee', 'F. Scott Fitzgerald'], explanation: "John Steinbeck wrote it (he also wrote The Grapes of Wrath). #1 mistake: confusing him with other American authors who also wrote about hard times." },
  { topic: 'theme', answerType: 'true-false', front: "True or False: The title 'Of Mice and Men' comes from a Robert Burns poem about how carefully made plans often go wrong.", back: 'True', choices: ['True', 'False'], explanation: "True. Burns wrote 'the best-laid schemes o' mice an' men / gang aft agley' (often go awry). #1 mistake: thinking the title is just about the mice Lennie pets — it signals the theme that George and Lennie's plans will fall apart." },
  // ---- Characters ----
  { topic: 'character', answerType: 'multiple-choice', front: "Which character is large and strong but has a childlike mind and loves to pet soft things?", back: 'Lennie', choices: ['Lennie', 'George', 'Slim', 'Candy'], explanation: "Lennie is physically powerful but mentally childlike. #1 mistake: mixing up Lennie and George — George is the small, sharp one who does the thinking." },
  { topic: 'character', answerType: 'multiple-choice', front: "Who travels with Lennie, makes the plans, and looks out for him?", back: 'George', choices: ['George', 'Curley', 'Carlson', 'Crooks'], explanation: "George Milton is Lennie's small, quick-witted protector. #1 mistake: swapping George and Lennie — remember 'George is the brain.'" },
  { topic: 'character', answerType: 'multiple-choice', front: "Which old ranch hand offers his life savings to join the dream farm after his dog is shot?", back: 'Candy', choices: ['Candy', 'Slim', 'Crooks', 'Curley'], explanation: "Candy, the aging swamper, buys into the dream to avoid being cast out when he's useless. #1 mistake: confusing Candy with Crooks — both are outsiders, but Candy is old and one-handed, Crooks is the Black stable hand." },
  { topic: 'character', answerType: 'multiple-choice', front: "The boss's aggressive, jealous son who picks fights to prove himself is —", back: 'Curley', choices: ['Curley', 'Slim', 'Carlson', 'Whit'], explanation: "Curley is small and pugnacious, especially toward big men like Lennie. #1 mistake: confusing Curley (the hot-headed son) with Carlson (the blunt worker who shoots Candy's dog)." },
  { topic: 'character', answerType: 'multiple-choice', front: "Which character is the skilled, calm mule driver whose judgment all the men respect?", back: 'Slim', choices: ['Slim', 'Curley', 'Candy', 'Crooks'], explanation: "Slim is the quiet, respected 'prince of the ranch.' #1 mistake: picking Curley — Curley demands respect through force; Slim earns it through skill and fairness." },
  { topic: 'character', answerType: 'multiple-choice', front: "Which character is isolated from the others because of his race and lives alone in the harness room?", back: 'Crooks', choices: ['Crooks', 'Candy', 'Lennie', 'Carlson'], explanation: "Crooks, the Black stable hand, is segregated and deeply lonely. #1 mistake: confusing his isolation (racism) with Candy's (age/disability)." },
  // ---- Plot / setting ----
  { topic: 'plot', answerType: 'multiple-choice', front: "Of Mice and Men is set in California during which period?", back: 'The Great Depression (1930s)', choices: ['The Great Depression (1930s)', 'The Civil War', 'The 1960s', 'Colonial times'], explanation: "The migrant-worker hardship reflects the 1930s Great Depression. #1 mistake: guessing the Civil War — the setting is modern ranch labor, not slavery-era." },
  { topic: 'plot', answerType: 'multiple-choice', front: "Why did George and Lennie have to run away from the town of Weed?", back: "Lennie grabbed a woman's dress and was accused of attacking her", choices: ["Lennie grabbed a woman's dress and was accused of attacking her", 'George stole money from the boss', 'They burned down a barn', 'They refused to pay rent'], explanation: "Lennie, wanting to feel the soft fabric, grabbed a girl's dress and wouldn't let go. #1 mistake: assuming he meant harm — like with the mice, his danger comes from not controlling his strength, not from cruelty." },
  { topic: 'plot', answerType: 'multiple-choice', front: "What do George and Lennie dream of owning one day?", back: "A small farm where they can 'live off the fatta the lan''", choices: ["A small farm where they can 'live off the fatta the lan''", 'A ranch in Mexico', 'A fishing boat', 'A store in the city'], explanation: "Their shared dream is a little farm with rabbits for Lennie to tend. #1 mistake: forgetting the rabbits — they're the detail Lennie always asks George to repeat." },
  { topic: 'plot', answerType: 'multiple-choice', front: "What does Lennie accidentally do that forces George to find him at the river?", back: "He accidentally kills Curley's wife", choices: ["He accidentally kills Curley's wife", 'He steals the dream-farm money', 'He attacks Slim', 'He sets fire to the bunkhouse'], explanation: "Lennie panics while stroking her hair and breaks her neck. #1 mistake: thinking he's violent on purpose — it mirrors how he kills the mouse and puppy: too strong, no control." },
  { topic: 'plot', answerType: 'multiple-choice', front: "How does the novel end?", back: 'George shoots Lennie himself to spare him a worse death', choices: ['George shoots Lennie himself to spare him a worse death', 'George and Lennie buy the farm', 'Lennie escapes on a train', 'Curley forgives Lennie'], explanation: "George mercy-kills Lennie before the mob (and Curley) can lynch him. #1 mistake: calling it simple murder — it parallels Candy's regret that a stranger shot his dog; George won't let that happen to Lennie." },
  // ---- Theme ----
  { topic: 'theme', answerType: 'multiple-choice', front: "The ranch workers' constant loneliness develops which major theme of the novel?", back: 'Isolation and the human need for companionship', choices: ['Isolation and the human need for companionship', 'The joy of city life', 'The importance of wealth', 'Respect for authority'], explanation: "Crooks, Candy, and Curley's wife are all painfully alone, which highlights why George and Lennie's friendship is so rare. #1 mistake: naming a plot event instead of the big idea — a theme is a message about life, not a summary." },
  { topic: 'theme', answerType: 'multiple-choice', front: "George and Lennie's farm dream — which never comes true — represents which theme?", back: 'The elusive, often unreachable American Dream', choices: ['The elusive, often unreachable American Dream', 'The reward of hard work', 'The value of education', 'The danger of nature'], explanation: "Their dream of land and freedom stands for the broader American Dream the Depression kept out of reach. #1 mistake: reading the dream as a happy ending — Steinbeck uses it to show how such dreams usually collapse." },
  // ---- Symbolism / foreshadowing ----
  { topic: 'symbolism', answerType: 'multiple-choice', front: "Carlson shooting Candy's old, useless dog most clearly foreshadows —", back: 'George shooting Lennie at the end', choices: ['George shooting Lennie at the end', 'Curley losing the fight', 'Slim leaving the ranch', 'Lennie buying the farm'], explanation: "The dog is put down because it's 'no good' to anyone — foreshadowing Lennie's fate and the mercy behind George's choice. #1 mistake: seeing the dog scene as unrelated; Steinbeck plants it on purpose." },
  { topic: 'symbolism', answerType: 'multiple-choice', front: "The rabbits Lennie always asks George to describe mainly symbolize —", back: 'The dream of a safe, happy future', choices: ['The dream of a safe, happy future', 'Lennie’s fear of George', 'The cruelty of the ranch', 'The coming of winter'], explanation: "Tending the rabbits is Lennie's whole picture of the dream. #1 mistake: reading them literally — they stand for the comfort and belonging he longs for." },
  { topic: 'symbolism', answerType: 'multiple-choice', front: "Lennie accidentally killing the mouse and later his puppy foreshadows that he will —", back: "accidentally kill Curley's wife", choices: ["accidentally kill Curley's wife", 'run away to Weed again', 'win the fight with Curley', 'finally get his own farm'], explanation: "The pattern — he loves soft things but kills them with his uncontrolled strength — builds to the climax. #1 mistake: treating the dead animals as random; they're a warning the reader is meant to notice." },
  // ---- Reading skill applied ----
  { topic: 'reading_skills', answerType: 'multiple-choice', front: "Steinbeck shows Lennie's gentleness by having him pet mice and puppies, rather than stating 'Lennie was gentle.' This technique is —", back: 'Indirect characterization', choices: ['Indirect characterization', 'Direct characterization', 'Foreshadowing', 'Symbolism'], explanation: "Indirect characterization reveals traits through actions, not a flat statement. #1 mistake: calling it direct — direct would be the narrator simply telling you 'Lennie was gentle.'" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function enrichPrompt(card) {
  return `You are an educational content enricher for a 9th grade high school student's flashcard app. The student takes: Spanish 1, Biology, English 1, and Integrated Math 2. She's 14, lives in California, uses social media (TikTok, Instagram), plays sports, watches movies/shows, and cares about animals and the environment. These cards are for her English 1 novel study of John Steinbeck's "Of Mice and Men."

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
  console.log('Steering unchanged. To prioritize this deck in Hailey\'s sessions, star it in AdminDashboard.');
}

main().catch((e) => { console.error('FAILED:', e.message || e); process.exit(1); });
