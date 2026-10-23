// Turns "starred decks only" on/off for a student in one subject (profiles.starred_only_subjects).
// With it ON, smart-session draws only from that student's starred decks in that subject.
// Requires the migration in supabase-migration.sql (adds profiles.starred_only_subjects).
// From recall-app/:
//   node scripts/set-starred-only.mjs hailey english          # turn ON  (dry run: shows the effect)
//   node scripts/set-starred-only.mjs hailey english --apply  # turn ON  (writes)
//   node scripts/set-starred-only.mjs hailey english --off --apply   # turn OFF
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const PEOPLE = { hailey: 'be5c10f0-adf1-4a14-90ba-19b16b250e14' };
const [who, subject] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const APPLY = process.argv.includes('--apply');
const OFF = process.argv.includes('--off');
const userId = PEOPLE[who] || who;
if (!userId || !subject) {
  console.error('usage: node scripts/set-starred-only.mjs <hailey|user-uuid> <subject> [--off] [--apply]');
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')])
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: profile, error } = await sb.from('profiles').select('display_name, starred_only_subjects').eq('id', userId).single();
if (error) {
  console.error(/starred_only_subjects/.test(error.message)
    ? 'Column profiles.starred_only_subjects does not exist yet. Run the last block of supabase-migration.sql in the Supabase SQL Editor first.'
    : `FAILED: ${error.message}`);
  process.exit(1);
}
const current = profile.starred_only_subjects || [];

// show what the student's sessions would draw from in this subject
const { data: stars } = await sb.from('deck_priorities').select('deck_id').eq('user_id', userId).eq('starred', true);
const starIds = new Set((stars || []).map((s) => s.deck_id));
const { data: decks } = await sb.from('decks').select('id, name').eq('subject', subject);
console.log(`${profile.display_name} — ${subject} decks:`);
for (const d of decks || []) console.log(`  ${starIds.has(d.id) ? '★ drawn from' : '  left out  '}  ${d.name}`);
if (!(decks || []).some((d) => starIds.has(d.id))) {
  console.log(`\nNo starred ${subject} deck — the lock would be ignored. Star a deck first.`);
}

const next = OFF ? current.filter((s) => s !== subject) : [...new Set([...current, subject])];
console.log(`\nstarred_only_subjects: [${current}] -> [${next}]${OFF ? '  (turning OFF)' : ''}`);
if (!APPLY) { console.log('Dry run — nothing written. Re-run with --apply.'); process.exit(0); }
const { error: upErr } = await sb.from('profiles').update({ starred_only_subjects: next }).eq('id', userId);
if (upErr) { console.error(`FAILED: ${upErr.message}`); process.exit(1); }
console.log('Saved.');
