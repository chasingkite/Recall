import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1).replace(/^"|"$/g,'')]));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const HAILEY='be5c10f0-adf1-4a14-90ba-19b16b250e14';
const OMAM='a897f704-7edc-42eb-95a6-34fd76560c35';   // English - Of Mice and Men
const TRIG='b2b71593-dbe2-4de1-942e-1b155ccb9cd6';   // Math - Right Triangle Trigonometry

// Current starred decks + subjects
const { data: cur } = await sb.from('deck_priorities').select('deck_id, starred, decks!inner(name,subject)').eq('user_id', HAILEY).eq('starred', true);

// Unstar stale MATH decks (she's moved from transformations/similarity to trig),
// but keep the new trig deck starred.
const staleMath = (cur||[]).filter(r => r.decks.subject === 'math' && r.deck_id !== TRIG);
for (const r of staleMath) {
  await sb.from('deck_priorities').update({ starred: false }).eq('user_id', HAILEY).eq('deck_id', r.deck_id);
}
console.log(`Unstarred ${staleMath.length} stale math decks: ${staleMath.map(r=>r.decks.name).join(', ')}`);

// Star the current-material decks (upsert on user_id+deck_id).
for (const id of [OMAM, TRIG]) {
  await sb.from('deck_priorities').upsert({ user_id: HAILEY, deck_id: id, starred: true }, { onConflict: 'user_id,deck_id' });
}

// Report final state
const { data: after } = await sb.from('deck_priorities').select('decks!inner(name,subject)').eq('user_id', HAILEY).eq('starred', true);
console.log('\nNow starred for Hailey:');
for (const r of (after||[]).sort((a,b)=>a.decks.subject.localeCompare(b.decks.subject))) console.log(` - [${r.decks.subject}] ${r.decks.name}`);
