import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")])
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
const ADMIN = "be2522d5-b953-4fa3-9920-6cb787c14ca7";
const HAILEY = "be5c10f0-adf1-4a14-90ba-19b16b250e14";

const DECK_NAME = "Spanish - Subject Pronouns";
const SUBJECT = "spanish";
const TOPIC = "subject_pronouns";

const cards = [
  // --- The pronouns (English -> Spanish, active recall) ---
  { front: "What is the Spanish subject pronoun for \"I\"?", back: "yo", answer_type: "type" },
  { front: "Which Spanish pronoun means \"you\" when talking to ONE friend, kid, or family member (informal)?", back: "tú", answer_type: "type" },
  { front: "Which Spanish pronoun means \"you\" when speaking formally/respectfully to ONE adult or stranger?", back: "usted", answer_type: "type" },
  { front: "What is the Spanish subject pronoun for \"he\"?", back: "él", answer_type: "type" },
  { front: "What is the Spanish subject pronoun for \"she\"?", back: "ella", answer_type: "type" },
  { front: "Which Spanish pronoun means \"we\" for a group that is all girls?", back: "nosotras", answer_type: "multiple-choice", choices: ["nosotros", "nosotras", "vosotras", "ellas"] },
  { front: "Which Spanish pronoun means \"we\" for a group of all boys or a mix of boys and girls?", back: "nosotros", answer_type: "multiple-choice", choices: ["nosotros", "nosotras", "ustedes", "ellos"] },
  { front: "Which pronoun means \"you all\" (plural), used everywhere in Latin America?", back: "ustedes", answer_type: "type" },
  { front: "Which pronoun means \"you all\" informally, used mainly in Spain?", back: "vosotros (or vosotras)", answer_type: "type" },
  { front: "Which pronoun means \"they\" for a group of all girls?", back: "ellas", answer_type: "multiple-choice", choices: ["ellos", "ellas", "nosotras", "ustedes"] },
  { front: "Which pronoun means \"they\" for a group of all boys or a mixed group?", back: "ellos", answer_type: "multiple-choice", choices: ["ellos", "ellas", "nosotros", "vosotros"] },

  // --- Spanish -> English (reverse recall) ---
  { front: "What does the Spanish pronoun \"tú\" mean in English?", back: "you (informal, one person)", answer_type: "type" },
  { front: "What does the Spanish pronoun \"usted\" mean in English?", back: "you (formal, one person)", answer_type: "type" },

  // --- Concepts & usage ---
  { front: "What is the difference between \"tú\" and \"usted\"?", back: "\"tú\" is informal (friends, kids, family); \"usted\" is formal and respectful (adults, teachers, strangers).", answer_type: "type" },
  { front: "For a mixed group of boys and girls, Spanish uses the masculine pronoun ___ for \"they.\"", back: "ellos", answer_type: "fill-blank" },
  { front: "You would use \"usted\" when talking to a close friend your own age.", back: "false", answer_type: "true-false" },
  { front: "You are talking to your teacher, Sra. Fawson. Which pronoun should you use?", back: "usted", answer_type: "multiple-choice", choices: ["tú", "usted", "vosotros", "ella"] },
  { front: "Spanish has a special pronoun for \"it\" as a subject, like English does.", back: "false", answer_type: "true-false" },
];

// Enrich a single card via Anthropic directly (mirrors app/api/enrich prompt)
async function enrichCard(card) {
  const prompt = `You are an educational content enricher for a 9th grade high school student's flashcard app. The student takes: Spanish 1, Biology, English 1, and Integrated Math 2. She's 14, lives in California, uses social media (TikTok, Instagram), plays sports, watches movies/shows, and cares about animals and the environment.

Flashcard:
- Subject: ${SUBJECT}
- Front (question): ${card.front}
- Back (answer): ${card.back}

Generate these 5 fields as JSON. Keep language simple, conversational, and relatable to a freshman:

1. "tokConnection" - A "how do we actually know this?" question (1-2 sentences). Make it something a curious 14-year-old would wonder.
2. "interdisciplinary" - Connect to her OTHER classes specifically: Biology, English 1, or Math 2 (1-2 sentences).
3. "inquiryQuestion" - A question that would spark debate with friends (1-2 sentences). No single right answer.
4. "realWorldConnection" - A specific example from her world: TikTok, Instagram, Netflix shows, sports, California, her phone, gaming (1-2 sentences).
5. "explanation" - Why the answer is correct in plain language (2-3 sentences). Mention the #1 mistake students make. Talk like a helpful older sibling.

Respond with ONLY valid JSON, no markdown:
{"tokConnection": "...", "interdisciplinary": "...", "inquiryQuestion": "...", "realWorldConnection": "...", "explanation": "..."}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 500, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  let text = data.content[0]?.text || "{}";
  text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(text);
}

async function main() {
  // Ensure deck
  let { data: deck } = await sb.from("decks").select("id").eq("name", DECK_NAME).maybeSingle();
  if (!deck) {
    const { data, error } = await sb.from("decks").insert({ name: DECK_NAME, subject: SUBJECT, created_by: ADMIN, shared: true }).select("id").single();
    if (error) throw error;
    deck = data;
    console.log(`created deck: ${DECK_NAME}`);
  } else {
    console.log(`deck exists: ${DECK_NAME} (${deck.id}) — skipping insert to avoid duplicates`);
    return;
  }

  console.log(`Enriching ${cards.length} cards via Anthropic…`);
  const rows = [];
  for (const c of cards) {
    let e = {};
    try { e = await enrichCard(c); } catch (err) { console.log(`  ⚠️ enrich failed for "${c.front.slice(0, 40)}…": ${err.message}`); }
    rows.push({
      deck_id: deck.id,
      front: c.front,
      back: c.back,
      answer_type: c.answer_type,
      choices: c.choices || null,
      topic: TOPIC,
      explanation: e.explanation || "",
      real_world_connection: e.realWorldConnection || "",
      tok_connection: e.tokConnection || "",
      interdisciplinary: e.interdisciplinary || "",
      inquiry_question: e.inquiryQuestion || "",
    });
    process.stdout.write(".");
  }
  console.log("");

  const { error } = await sb.from("cards").insert(rows);
  if (error) throw error;
  const enriched = rows.filter((r) => r.explanation).length;
  console.log(`✅ inserted ${rows.length} cards (${enriched} enriched) into "${DECK_NAME}"`);

  // Star for Hailey (add alongside her existing Spanish stars)
  const { error: starErr } = await sb.from("deck_priorities").upsert(
    { user_id: HAILEY, deck_id: deck.id, starred: true },
    { onConflict: "user_id,deck_id" }
  );
  if (starErr) throw starErr;
  console.log(`⭐ starred "${DECK_NAME}" for Hailey`);
}

main().catch((e) => { console.error("FAILED:", e.message || e); process.exit(1); });
