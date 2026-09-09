import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const TEMP_SUBJECT = 'mathdilation';
const DECK_NAMES = [
  'dilation_transformation',
  'IM2 Ch2 - Transformations & Similarity',
  'Dilation — IXL Practice',
  'Transformations — Rules & Concepts',
  'Transformations — Graph Practice',
];

async function main() {
  // Hailey
  const { data: prof } = await sb.from('profiles').select('id, subjects').ilike('email', 'haileyoliviatran%').single();
  // Decks to move (currently subject 'math')
  const { data: decks } = await sb.from('decks').select('id, name, subject').in('name', DECK_NAMES);

  // Save revert state
  const revert = {
    hailey_id: prof.id,
    hailey_subjects: prof.subjects,
    decks: decks.map((d) => ({ id: d.id, name: d.name, subject: d.subject })),
  };
  writeFileSync('scripts/hailey-focus-revert.json', JSON.stringify(revert, null, 2));
  console.log('Saved revert state to scripts/hailey-focus-revert.json');
  console.log('  Hailey original subjects:', JSON.stringify(prof.subjects));
  console.log('  Decks to move:', decks.map((d) => `${d.name} (${d.subject})`).join(', '));

  // Apply: move decks to temp subject
  for (const d of decks) {
    const { error } = await sb.from('decks').update({ subject: TEMP_SUBJECT }).eq('id', d.id);
    if (error) throw error;
  }
  // Apply: Hailey sees only the temp subject
  const { error: pe } = await sb.from('profiles').update({ subjects: [TEMP_SUBJECT] }).eq('id', prof.id);
  if (pe) throw pe;

  // Verify
  const { data: pool } = await sb.from('cards').select('topic, decks!inner(subject)').eq('decks.subject', TEMP_SUBJECT);
  const topics = {}; let psat = 0;
  for (const c of pool) { topics[c.topic || '(none)'] = (topics[c.topic || '(none)'] || 0) + 1; if ((c.topic || '').startsWith('psat')) psat++; }
  console.log(`\nDONE. Hailey's card pool is now ${pool.length} cards, subject="${TEMP_SUBJECT}".`);
  console.log('  PSAT cards in pool:', psat, '(should be 0)');
  console.log('  topics:', JSON.stringify(topics));
}
main().catch((e) => { console.error('FAILED:', e.message || e); process.exit(1); });
