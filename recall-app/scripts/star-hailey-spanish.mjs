// One-off: prioritize Hailey's Spanish "Preliminar" decks for her test.
// Clears stale math stars, stars the two Spanish decks matching the Spanish 1
// Preliminary Quiz (greetings, numbers, months, days, introductions, politeness).
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')])
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const HAILEY = 'be5c10f0-adf1-4a14-90ba-19b16b250e14';

const SPANISH_DECKS = [
  '5b376c53-7a1d-44f7-882a-0ced17cd4d53', // Spanish - Core Vocabulary and Grammar
  'e48905db-fc66-464d-81ed-5b624ae83a65', // Spanish - Greetings and Basic Phrases
];

const nameFor = async (ids) => {
  const { data } = await sb.from('decks').select('id, name').in('id', ids);
  return Object.fromEntries((data || []).map((d) => [d.id, d.name]));
};

// Before
const { data: before } = await sb.from('deck_priorities').select('deck_id').eq('user_id', HAILEY).eq('starred', true);
const beforeIds = (before || []).map((r) => r.deck_id);
const beforeNames = await nameFor(beforeIds);
console.log('BEFORE — starred:', beforeIds.map((id) => beforeNames[id] || id).join(', ') || '(none)');

// Clear all existing stars, then star only the Spanish Preliminar decks
const { error: delErr } = await sb.from('deck_priorities').delete().eq('user_id', HAILEY);
if (delErr) throw delErr;
for (const deckId of SPANISH_DECKS) {
  const { error } = await sb.from('deck_priorities').upsert(
    { user_id: HAILEY, deck_id: deckId, starred: true },
    { onConflict: 'user_id,deck_id' }
  );
  if (error) throw error;
}

// After
const { data: after } = await sb.from('deck_priorities').select('deck_id').eq('user_id', HAILEY).eq('starred', true);
const afterIds = (after || []).map((r) => r.deck_id);
const afterNames = await nameFor(afterIds);
console.log('AFTER  — starred:', afterIds.map((id) => afterNames[id] || id).join(', ') || '(none)');

// How many cards are now boosted
for (const deckId of SPANISH_DECKS) {
  const { count } = await sb.from('cards').select('id', { count: 'exact', head: true }).eq('deck_id', deckId);
  console.log(`  ${afterNames[deckId]}: ${count} cards`);
}
console.log('\nDone. Hailey\'s sessions now order these Spanish cards first.');
